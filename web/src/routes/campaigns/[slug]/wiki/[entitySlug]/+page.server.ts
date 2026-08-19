import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { requireCampaignAccess, requireOwner } from '$lib/server/auth/guards';
import { campaigns, entities } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

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

export const actions = {
	delete: async ({ cookies, params, platform }) => {
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

		const entityResults = await db
			.select({ id: entities.id })
			.from(entities)
			.where(and(eq(entities.campaignId, campaign.id), eq(entities.slug, params.entitySlug)))
			.limit(1);

		const entity = entityResults[0];

		if (!entity) {
			error(404, 'Wiki entry not found.');
		}

		try {
			await db.delete(entities).where(eq(entities.id, entity.id));
		} catch (caught) {
			console.error(
				'Wiki entry deletion failed:',
				caught instanceof Error ? caught.message : caught
			);

			return fail(500, {
				success: false,
				message: 'The Wiki entry could not be deleted. Please try again.'
			});
		}

		redirect(303, `/campaigns/${campaign.slug}/wiki`);
	}
} satisfies Actions;
