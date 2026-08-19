import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { requireOwner } from '$lib/server/auth/guards';
import { campaigns } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
	const db = await requireOwner(platform, cookies);

	const results = await db.select().from(campaigns).where(eq(campaigns.slug, params.slug)).limit(1);

	const campaign = results[0];

	if (!campaign) {
		error(404, 'Campaign not found.');
	}

	return { campaign };
};

export const actions = {
	default: async ({ cookies, request, params, platform }) => {
		const db = await requireOwner(platform, cookies);
		const formData = await request.formData();

		const name = String(formData.get('name') ?? '').trim();
		const description = String(formData.get('description') ?? '').trim();
		const values = { name, description };

		if (!name) {
			return fail(400, {
				success: false,
				message: 'Please enter a campaign name.',
				values
			});
		}

		const results = await db
			.select({ id: campaigns.id, slug: campaigns.slug })
			.from(campaigns)
			.where(eq(campaigns.slug, params.slug))
			.limit(1);

		const campaign = results[0];

		if (!campaign) {
			error(404, 'Campaign not found.');
		}

		try {
			await db
				.update(campaigns)
				.set({
					name,
					description,
					updatedAt: new Date()
				})
				.where(eq(campaigns.id, campaign.id));
		} catch (caught) {
			console.error('Campaign update failed:', caught instanceof Error ? caught.message : caught);

			return fail(500, {
				success: false,
				message: 'The campaign could not be updated. Please try again.',
				values
			});
		}

		redirect(303, `/campaigns/${campaign.slug}`);
	}
} satisfies Actions;
