import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { campaigns, entities } from '$lib/server/db/schema';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!platform) {
		error(500, 'Cloudflare database binding is unavailable.');
	}

	const db = getDb(platform.env.DB);

	const campaignResults = await db
		.select()
		.from(campaigns)
		.where(eq(campaigns.slug, params.slug))
		.limit(1);

	const campaign = campaignResults[0];

	if (!campaign) {
		error(404, 'Campaign not found.');
	}

	const entityResults = await db
		.select()
		.from(entities)
		.where(
			and(
				eq(entities.campaignId, campaign.id),
				eq(entities.slug, params.entitySlug)
			)
		)
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