import { eq } from 'drizzle-orm';

import { hasCampaignEditAccess, readAccessSession } from '$lib/server/auth/session';
import { getDb } from '$lib/server/db';
import { campaigns } from '$lib/server/db/schema';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, params, platform }) => {
	if (!platform) {
		return { canEdit: false, isCampaignEditor: false };
	}

	const db = getDb(platform.env.DB);
	const campaignResults = await db
		.select({ id: campaigns.id })
		.from(campaigns)
		.where(eq(campaigns.slug, params.slug))
		.limit(1);
	const campaign = campaignResults[0];

	if (!campaign) {
		return { canEdit: false, isCampaignEditor: false };
	}

	const session = await readAccessSession(db, cookies);
	const canEdit = await hasCampaignEditAccess(db, session, campaign.id);

	return {
		canEdit,
		isCampaignEditor: canEdit && !session?.isOwner
	};
};
