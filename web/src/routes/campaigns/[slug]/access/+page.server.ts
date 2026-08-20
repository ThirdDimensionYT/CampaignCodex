import { error, fail } from '@sveltejs/kit';
import { and, asc, eq, sql } from 'drizzle-orm';

import {
	createCampaignPassphraseCredential,
	createEditorPassphraseCredential
} from '$lib/server/auth/crypto';
import { requireOwner } from '$lib/server/auth/guards';
import {
	campaignAccessCredentials,
	campaignEditorCredentials,
	campaigns
} from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
	if (!platform) {
		error(500, 'Cloudflare database binding is unavailable.');
	}

	const db = await requireOwner(platform, cookies);

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
		.select({
			campaignId: campaignAccessCredentials.campaignId
		})
		.from(campaignAccessCredentials)
		.where(eq(campaignAccessCredentials.campaignId, campaign.id))
		.limit(1);
	const editors = await db
		.select({
			id: campaignEditorCredentials.id,
			label: campaignEditorCredentials.label,
			createdAt: campaignEditorCredentials.createdAt
		})
		.from(campaignEditorCredentials)
		.where(eq(campaignEditorCredentials.campaignId, campaign.id))
		.orderBy(asc(campaignEditorCredentials.label));

	return {
		campaign,
		hasPassphrase: credentialResults.length > 0,
		editors
	};
};

export const actions = {
	player: async ({ cookies, params, platform, request }) => {
		if (!platform) {
			error(500, 'Cloudflare database binding is unavailable.');
		}

		const db = await requireOwner(platform, cookies);
		const formData = await request.formData();
		const passphrase = String(formData.get('passphrase') ?? '').trim();

		if (passphrase.length < 8) {
			return fail(400, {
				success: false,
				section: 'player' as const,
				message: 'Use a passphrase containing at least 8 characters.'
			});
		}

		if (passphrase.length > 128) {
			return fail(400, {
				success: false,
				section: 'player' as const,
				message: 'The passphrase must be no more than 128 characters.'
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

		const credential = await createCampaignPassphraseCredential(
			passphrase,
			platform.env.AUTH_SECRET
		);

		await db
			.insert(campaignAccessCredentials)
			.values({
				campaignId: campaign.id,
				passphraseHash: credential.passphraseHash,
				passphraseSalt: credential.passphraseSalt,
				accessVersion: 1
			})
			.onConflictDoUpdate({
				target: campaignAccessCredentials.campaignId,
				set: {
					passphraseHash: credential.passphraseHash,
					passphraseSalt: credential.passphraseSalt,
					accessVersion: sql`${campaignAccessCredentials.accessVersion} + 1`,
					updatedAt: new Date()
				}
			});

		return {
			success: true,
			section: 'player' as const,
			message: 'Campaign passphrase saved. Previous player access has been revoked.'
		};
	},
	createEditor: async ({ cookies, params, platform, request }) => {
		if (!platform) {
			error(500, 'Cloudflare database binding is unavailable.');
		}

		const db = await requireOwner(platform, cookies);
		const formData = await request.formData();
		const label = String(formData.get('label') ?? '')
			.trim()
			.replace(/\s+/g, ' ');
		const passphrase = String(formData.get('editorPassphrase') ?? '').trim();

		if (label.length < 2 || label.length > 80) {
			return fail(400, {
				success: false,
				section: 'editor' as const,
				message: 'Enter a name between 2 and 80 characters for this editor.'
			});
		}

		if (passphrase.length < 12 || passphrase.length > 128) {
			return fail(400, {
				success: false,
				section: 'editor' as const,
				message: 'Editor passwords must contain between 12 and 128 characters.'
			});
		}

		const campaignResults = await db
			.select({ id: campaigns.id })
			.from(campaigns)
			.where(eq(campaigns.slug, params.slug))
			.limit(1);
		const campaign = campaignResults[0];

		if (!campaign) {
			error(404, 'Campaign not found.');
		}

		const credential = await createEditorPassphraseCredential(passphrase, platform.env.AUTH_SECRET);

		try {
			await db.insert(campaignEditorCredentials).values({
				campaignId: campaign.id,
				label,
				normalizedLabel: label.toLocaleLowerCase('en-GB'),
				passphraseHash: credential.passphraseHash,
				passphraseSalt: credential.passphraseSalt
			});
		} catch (caught) {
			console.error(
				'Editor credential creation failed:',
				caught instanceof Error ? caught.message : caught
			);

			return fail(409, {
				success: false,
				section: 'editor' as const,
				message: `An editor named “${label}” already exists for this campaign.`
			});
		}

		return {
			success: true,
			section: 'editor' as const,
			message: `Editor access created for ${label}. You can now give them that password.`
		};
	},
	revokeEditor: async ({ cookies, params, platform, request }) => {
		const db = await requireOwner(platform, cookies);
		const formData = await request.formData();
		const editorId = String(formData.get('editorId') ?? '').trim();
		const campaignResults = await db
			.select({ id: campaigns.id })
			.from(campaigns)
			.where(eq(campaigns.slug, params.slug))
			.limit(1);
		const campaign = campaignResults[0];

		if (!campaign) {
			error(404, 'Campaign not found.');
		}

		const editorResults = await db
			.select({ label: campaignEditorCredentials.label })
			.from(campaignEditorCredentials)
			.where(
				and(
					eq(campaignEditorCredentials.id, editorId),
					eq(campaignEditorCredentials.campaignId, campaign.id)
				)
			)
			.limit(1);
		const editor = editorResults[0];

		if (!editor) {
			return fail(404, {
				success: false,
				section: 'editor' as const,
				message: 'That editor could not be found.'
			});
		}

		await db
			.delete(campaignEditorCredentials)
			.where(
				and(
					eq(campaignEditorCredentials.id, editorId),
					eq(campaignEditorCredentials.campaignId, campaign.id)
				)
			);

		return {
			success: true,
			section: 'editor' as const,
			message: `Editor access for ${editor.label} was revoked.`
		};
	}
} satisfies Actions;
