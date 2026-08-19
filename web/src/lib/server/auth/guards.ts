import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { campaignAccessCredentials, campaigns } from '$lib/server/db/schema';

import { hasCampaignAccess, readAccessSession } from './session';

import type { Cookies } from '@sveltejs/kit';

export const requireOwner = async (platform: App.Platform | undefined, cookies: Cookies) => {
	if (!platform) {
		error(500, 'Cloudflare database binding is unavailable.');
	}

	const db = getDb(platform.env.DB);
	const session = await readAccessSession(db, cookies);

	if (!session?.isOwner) {
		redirect(303, '/owner/login');
	}

	return db;
};

export const requireCampaignAccess = async (
	platform: App.Platform | undefined,
	cookies: Cookies,
	campaignSlug: string
) => {
	if (!platform) {
		error(500, 'Cloudflare database binding is unavailable.');
	}

	const db = getDb(platform.env.DB);

	const campaignResults = await db
		.select()
		.from(campaigns)
		.where(eq(campaigns.slug, campaignSlug))
		.limit(1);

	const campaign = campaignResults[0];

	if (!campaign) {
		error(404, 'Campaign not found.');
	}

	const session = await readAccessSession(db, cookies);

	if (session?.isOwner) {
		return {
			db,
			campaign
		};
	}

	const credentialResults = await db
		.select({
			accessVersion: campaignAccessCredentials.accessVersion
		})
		.from(campaignAccessCredentials)
		.where(eq(campaignAccessCredentials.campaignId, campaign.id))
		.limit(1);

	const credential = credentialResults[0];

	if (
		!credential ||
		!(await hasCampaignAccess(db, session, campaign.id, credential.accessVersion))
	) {
		redirect(303, `/campaigns/${campaign.slug}/unlock`);
	}

	return {
		db,
		campaign
	};
};
