import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { verifyCampaignPassphrase, verifyEditorPassphrase } from '$lib/server/auth/crypto';
import {
	createAccessSession,
	grantCampaignAccess,
	grantCampaignEditorAccess,
	hasCampaignAccess,
	hasCampaignEditAccess,
	readAccessSession
} from '$lib/server/auth/session';
import { getDb } from '$lib/server/db';
import {
	campaignAccessCredentials,
	campaignEditorCredentials,
	campaigns
} from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

function openDatabase(platform: App.Platform | undefined) {
	if (!platform) {
		error(500, 'Cloudflare database binding is unavailable.');
	}

	return getDb(platform.env.DB);
}

export const load: PageServerLoad = async ({ cookies, params, platform, url }) => {
	const db = openDatabase(platform);

	const campaignResults = await db
		.select()
		.from(campaigns)
		.where(eq(campaigns.slug, params.slug))
		.limit(1);

	const campaign = campaignResults[0];

	if (!campaign) {
		error(404, 'Campaign not found.');
	}

	const credentialResults = await db
		.select()
		.from(campaignAccessCredentials)
		.where(eq(campaignAccessCredentials.campaignId, campaign.id))
		.limit(1);

	const credential = credentialResults[0];
	const session = await readAccessSession(db, cookies);

	if (session?.isOwner) {
		redirect(303, `/campaigns/${campaign.slug}/wiki`);
	}

	if (await hasCampaignEditAccess(db, session, campaign.id)) {
		redirect(303, `/campaigns/${campaign.slug}/wiki`);
	}

	if (
		!url.searchParams.has('editor') &&
		credential &&
		(await hasCampaignAccess(db, session, campaign.id, credential.accessVersion))
	) {
		redirect(303, `/campaigns/${campaign.slug}/wiki`);
	}

	return {
		campaign,
		hasPassphrase: Boolean(credential),
		hasEditorAccess:
			(
				await db
					.select({ id: campaignEditorCredentials.id })
					.from(campaignEditorCredentials)
					.where(eq(campaignEditorCredentials.campaignId, campaign.id))
					.limit(1)
			).length > 0
	};
};

export const actions = {
	player: async ({ cookies, params, platform, request }) => {
		if (!platform) {
			error(500, 'Cloudflare database binding is unavailable.');
		}

		const db = openDatabase(platform);
		const formData = await request.formData();
		const passphrase = String(formData.get('passphrase') ?? '').trim();

		if (!passphrase || passphrase.length > 128) {
			return fail(400, {
				success: false,
				section: 'player' as const,
				message: 'Please enter a valid campaign passphrase.'
			});
		}

		const campaignResults = await db
			.select()
			.from(campaigns)
			.where(eq(campaigns.slug, params.slug))
			.limit(1);

		const campaign = campaignResults[0];

		if (!campaign) {
			error(404, 'Campaign not found.');
		}

		const credentialResults = await db
			.select()
			.from(campaignAccessCredentials)
			.where(eq(campaignAccessCredentials.campaignId, campaign.id))
			.limit(1);

		const credential = credentialResults[0];

		if (!credential) {
			return fail(403, {
				success: false,
				section: 'player' as const,
				message: 'Player access has not been configured for this campaign.'
			});
		}

		let session = await readAccessSession(db, cookies);

		if (session?.isOwner) {
			redirect(303, `/campaigns/${campaign.slug}/wiki`);
		}

		const passphraseIsCorrect = await verifyCampaignPassphrase(
			passphrase,
			credential.passphraseHash,
			credential.passphraseSalt,
			platform.env.AUTH_SECRET
		);

		if (!passphraseIsCorrect) {
			return fail(401, {
				success: false,
				section: 'player' as const,
				message: 'The campaign passphrase was not recognised.'
			});
		}

		if (!session) {
			session = await createAccessSession(db, cookies, false);
		}

		await grantCampaignAccess(db, session.id, campaign.id, credential.accessVersion);

		redirect(303, `/campaigns/${campaign.slug}/wiki`);
	},
	editor: async ({ cookies, params, platform, request }) => {
		if (!platform) {
			error(500, 'Cloudflare database binding is unavailable.');
		}

		const db = openDatabase(platform);
		const formData = await request.formData();
		const passphrase = String(formData.get('editorPassphrase') ?? '').trim();

		if (!passphrase || passphrase.length > 128) {
			return fail(400, {
				success: false,
				section: 'editor' as const,
				message: 'Please enter a valid editor password.'
			});
		}

		const campaignResults = await db
			.select()
			.from(campaigns)
			.where(eq(campaigns.slug, params.slug))
			.limit(1);
		const campaign = campaignResults[0];

		if (!campaign) {
			error(404, 'Campaign not found.');
		}

		const credentials = await db
			.select()
			.from(campaignEditorCredentials)
			.where(eq(campaignEditorCredentials.campaignId, campaign.id));

		if (credentials.length === 0) {
			return fail(403, {
				success: false,
				section: 'editor' as const,
				message: 'Editor access has not been configured for this campaign.'
			});
		}

		const matches = await Promise.all(
			credentials.map((credential) =>
				verifyEditorPassphrase(
					passphrase,
					credential.passphraseHash,
					credential.passphraseSalt,
					platform.env.AUTH_SECRET
				)
			)
		);
		const credential = credentials[matches.findIndex(Boolean)];

		if (!credential) {
			return fail(401, {
				success: false,
				section: 'editor' as const,
				message: 'The editor password was not recognised.'
			});
		}

		let session = await readAccessSession(db, cookies);

		if (session?.isOwner) {
			redirect(303, `/campaigns/${campaign.slug}/wiki`);
		}

		if (!session) {
			session = await createAccessSession(db, cookies, false);
		}

		await grantCampaignEditorAccess(db, session.id, credential.id, credential.accessVersion);

		redirect(303, `/campaigns/${campaign.slug}/wiki`);
	}
} satisfies Actions;
