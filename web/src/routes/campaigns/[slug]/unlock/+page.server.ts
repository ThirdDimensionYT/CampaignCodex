import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { verifyCampaignPassphrase } from '$lib/server/auth/crypto';
import {
	createAccessSession,
	grantCampaignAccess,
	hasCampaignAccess,
	readAccessSession
} from '$lib/server/auth/session';
import { getDb } from '$lib/server/db';
import { campaignAccessCredentials, campaigns } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

function openDatabase(platform: App.Platform | undefined) {
	if (!platform) {
		error(500, 'Cloudflare database binding is unavailable.');
	}

	return getDb(platform.env.DB);
}

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
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

	if (credential && (await hasCampaignAccess(db, session, campaign.id, credential.accessVersion))) {
		redirect(303, `/campaigns/${campaign.slug}/wiki`);
	}

	return {
		campaign,
		hasPassphrase: Boolean(credential)
	};
};

export const actions = {
	default: async ({ cookies, params, platform, request }) => {
		if (!platform) {
			error(500, 'Cloudflare database binding is unavailable.');
		}

		const db = openDatabase(platform);
		const formData = await request.formData();
		const passphrase = String(formData.get('passphrase') ?? '').trim();

		if (!passphrase || passphrase.length > 128) {
			return fail(400, {
				success: false,
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
				message: 'The campaign passphrase was not recognised.'
			});
		}

		if (!session) {
			session = await createAccessSession(db, cookies, false);
		}

		await grantCampaignAccess(db, session.id, campaign.id, credential.accessVersion);

		redirect(303, `/campaigns/${campaign.slug}/wiki`);
	}
} satisfies Actions;
