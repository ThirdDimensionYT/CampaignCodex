import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

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

	const results = await db.select().from(campaigns).where(eq(campaigns.slug, params.slug)).limit(1);

	const campaign = results[0];

	if (!campaign) {
		error(404, 'Campaign not found.');
	}

	return {
		campaign
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
			await db.insert(entities).values({
				campaignId: campaign.id,
				type: entityType,
				name,
				slug,
				summary,
				content
			});
		} catch (caught) {
			console.error(
				'Wiki entry creation failed:',
				caught instanceof Error ? caught.message : caught
			);

			return fail(409, {
				success: false,
				message: 'A wiki entry with that name may already exist.',
				values
			});
		}

		return {
			success: true,
			message: 'Wiki entry saved successfully.',
			values: {
				type: 'character',
				name: '',
				summary: '',
				content: ''
			}
		};
	}
} satisfies Actions;
