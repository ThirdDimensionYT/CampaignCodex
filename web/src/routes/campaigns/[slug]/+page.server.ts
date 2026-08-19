import { error, fail } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';

import { requireCampaignAccess, requireOwner } from '$lib/server/auth/guards';
import { campaigns, entities, sessions } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
	const { db, campaign } = await requireCampaignAccess(platform, cookies, params.slug);

	const sessionList = await db
		.select()
		.from(sessions)
		.where(eq(sessions.campaignId, campaign.id))
		.orderBy(desc(sessions.sessionNumber));

	const entityList = await db
		.select()
		.from(entities)
		.where(eq(entities.campaignId, campaign.id))
		.orderBy(asc(entities.type), asc(entities.name));

	return {
		campaign,
		sessions: sessionList,
		entities: entityList
	};
};

export const actions = {
	createSession: async ({ cookies, request, params, platform }) => {
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

		const formData = await request.formData();

		const sessionNumberText = String(formData.get('sessionNumber') ?? '').trim();

		const title = String(formData.get('title') ?? '').trim();
		const sessionDateText = String(formData.get('sessionDate') ?? '').trim();
		const rawNotes = String(formData.get('rawNotes') ?? '').trim();

		const values = {
			sessionNumber: sessionNumberText,
			title,
			sessionDate: sessionDateText,
			rawNotes
		};

		const sessionNumber = Number(sessionNumberText);

		if (!Number.isInteger(sessionNumber) || sessionNumber < 1) {
			return fail(400, {
				success: false,
				message: 'Session number must be a whole number greater than zero.',
				values
			});
		}

		if (!title) {
			return fail(400, {
				success: false,
				message: 'Please enter a session title.',
				values
			});
		}

		let sessionDate: Date | null = null;

		if (sessionDateText) {
			const parsedDate = new Date(`${sessionDateText}T00:00:00Z`);

			if (Number.isNaN(parsedDate.getTime())) {
				return fail(400, {
					success: false,
					message: 'Please enter a valid session date.',
					values
				});
			}

			sessionDate = parsedDate;
		}

		try {
			await db.insert(sessions).values({
				campaignId: campaign.id,
				sessionNumber,
				title,
				sessionDate,
				rawNotes
			});
		} catch (caught) {
			console.error('Session creation failed:', caught instanceof Error ? caught.message : caught);

			return fail(409, {
				success: false,
				message: 'That session number may already exist in this campaign.',
				values
			});
		}

		return {
			success: true,
			message: 'Session saved successfully.',
			values: {
				sessionNumber: '',
				title: '',
				sessionDate: '',
				rawNotes: ''
			}
		};
	}
} satisfies Actions;
