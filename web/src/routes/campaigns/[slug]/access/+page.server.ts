import { error, fail } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';

import { createCampaignPassphraseCredential } from '$lib/server/auth/crypto';
import { requireOwner } from '$lib/server/auth/guards';
import { campaignAccessCredentials, campaigns } from '$lib/server/db/schema';

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

	return {
		campaign,
		hasPassphrase: credentialResults.length > 0
	};
};

export const actions = {
	default: async ({ cookies, params, platform, request }) => {
		if (!platform) {
			error(500, 'Cloudflare database binding is unavailable.');
		}

		const db = await requireOwner(platform, cookies);
		const formData = await request.formData();
		const passphrase = String(formData.get('passphrase') ?? '').trim();

		if (passphrase.length < 8) {
			return fail(400, {
				success: false,
				message: 'Use a passphrase containing at least 8 characters.'
			});
		}

		if (passphrase.length > 128) {
			return fail(400, {
				success: false,
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
			message: 'Campaign passphrase saved. Previous player access has been revoked.'
		};
	}
} satisfies Actions;
