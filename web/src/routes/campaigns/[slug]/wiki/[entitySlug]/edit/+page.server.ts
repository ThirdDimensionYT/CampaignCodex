import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { requireCampaignEditor } from '$lib/server/auth/guards';
import { campaigns, entities, entityTypes } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

type EntityType = (typeof entityTypes)[number];

function makeSlug(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function isEntityType(value: string): value is EntityType {
	return entityTypes.includes(value as EntityType);
}

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
	const db = await requireCampaignEditor(platform, cookies, params.slug);

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
	default: async ({ cookies, request, params, platform }) => {
		const db = await requireCampaignEditor(platform, cookies, params.slug);

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
			.where(and(eq(entities.campaignId, campaign.id), eq(entities.slug, params.entitySlug)))
			.limit(1);

		const entity = entityResults[0];

		if (!entity) {
			error(404, 'Wiki entry not found.');
		}

		const formData = await request.formData();

		const entityType = String(formData.get('type') ?? '');
		const name = String(formData.get('name') ?? '').trim();
		const summary = String(formData.get('summary') ?? '').trim();
		const content = String(formData.get('content') ?? '').trim();

		const values = {
			type: entityType,
			name,
			summary,
			content
		};

		if (!isEntityType(entityType)) {
			return fail(400, {
				success: false,
				message: 'Please select a valid entry type.',
				values
			});
		}

		if (!name) {
			return fail(400, {
				success: false,
				message: 'Please enter a name for this wiki entry.',
				values
			});
		}

		const slug = makeSlug(name);

		if (!slug) {
			return fail(400, {
				success: false,
				message: 'The name must contain letters or numbers.',
				values
			});
		}

		try {
			await db
				.update(entities)
				.set({
					type: entityType,
					name,
					slug,
					summary,
					content,
					updatedAt: new Date()
				})
				.where(eq(entities.id, entity.id));
		} catch (caught) {
			console.error('Wiki entry update failed:', caught instanceof Error ? caught.message : caught);

			return fail(409, {
				success: false,
				message: 'Another wiki entry may already use that name.',
				values
			});
		}

		redirect(303, `/campaigns/${campaign.slug}/wiki/${slug}`);
	}
} satisfies Actions;
