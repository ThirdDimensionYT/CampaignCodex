import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import {
	campaigns,
	entities,
	entityTypes,
	visibilityLevels
} from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

type EntityType = (typeof entityTypes)[number];
type Visibility = (typeof visibilityLevels)[number];

function openDatabase(platform: App.Platform | undefined) {
	if (!platform) {
		error(500, 'Cloudflare database binding is unavailable.');
	}

	return getDb(platform.env.DB);
}

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

function isVisibility(value: string): value is Visibility {
	return visibilityLevels.includes(value as Visibility);
}

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = openDatabase(platform);

	const results = await db
		.select()
		.from(campaigns)
		.where(eq(campaigns.slug, params.slug))
		.limit(1);

	const campaign = results[0];

	if (!campaign) {
		error(404, 'Campaign not found.');
	}

	return {
		campaign
	};
};

export const actions = {
	default: async ({ request, params, platform }) => {
		const db = openDatabase(platform);

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
		const visibility = String(formData.get('visibility') ?? 'players');

		const values = {
			type: entityType,
			name,
			summary,
			content,
			visibility
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

		if (!isVisibility(visibility)) {
			return fail(400, {
				success: false,
				message: 'Please select a valid visibility.',
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
				content,
				visibility
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
				content: '',
				visibility: 'players'
			}
		};
	}
} satisfies Actions;