import { asc, eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

import { requireCampaignAccess } from '$lib/server/auth/guards';
import { entities } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
	const { db, campaign } = await requireCampaignAccess(platform, cookies, params.slug);

	if (campaign.kind === 'armoury') {
		redirect(303, `/campaigns/${campaign.slug}/armoury`);
	}

	const entityList = await db
		.select()
		.from(entities)
		.where(eq(entities.campaignId, campaign.id))
		.orderBy(asc(entities.type), asc(entities.name));

	return {
		campaign,
		entities: entityList
	};
};
