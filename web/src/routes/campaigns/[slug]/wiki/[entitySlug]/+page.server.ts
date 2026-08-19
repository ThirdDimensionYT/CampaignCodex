import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { requireCampaignAccess } from '$lib/server/auth/guards';
import { entities } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
	const { db, campaign } = await requireCampaignAccess(platform, cookies, params.slug);

	const entityResults = await db
		.select()
		.from(entities)
		.where(and(eq(entities.campaignId, campaign.id), eq(entities.slug, params.entitySlug)))
		.limit(1);

	const entity = entityResults[0];

	if (!entity) {
		error(404, 'Wiki entry not found.');
	}

	return {
		campaign,
		entity
	};
};
