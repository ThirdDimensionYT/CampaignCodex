import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { requireOwner } from '$lib/server/auth/guards';
import { campaigns, sessions } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

function parseSessionNumber(value: string): number | null {
	const sessionNumber = Number(value);

	return Number.isInteger(sessionNumber) && sessionNumber > 0 ? sessionNumber : null;
}

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
	const db = await requireOwner(platform, cookies);
	const originalSessionNumber = parseSessionNumber(params.sessionNumber);

	if (originalSessionNumber === null) {
		error(404, 'Session not found.');
	}

	const campaignResults = await db
		.select()
		.from(campaigns)
		.where(eq(campaigns.slug, params.slug))
		.limit(1);

	const campaign = campaignResults[0];

	if (!campaign) {
		error(404, 'Campaign not found.');
	}

	const sessionResults = await db
		.select()
		.from(sessions)
		.where(
			and(eq(sessions.campaignId, campaign.id), eq(sessions.sessionNumber, originalSessionNumber))
		)
		.limit(1);

	const session = sessionResults[0];

	if (!session) {
		error(404, 'Session not found.');
	}

	return { campaign, session };
};

export const actions = {
	default: async ({ cookies, request, params, platform }) => {
		const db = await requireOwner(platform, cookies);
		const originalSessionNumber = parseSessionNumber(params.sessionNumber);

		if (originalSessionNumber === null) {
			error(404, 'Session not found.');
		}

		const campaignResults = await db
			.select()
			.from(campaigns)
			.where(eq(campaigns.slug, params.slug))
			.limit(1);

		const campaign = campaignResults[0];

		if (!campaign) {
			error(404, 'Campaign not found.');
		}

		const sessionResults = await db
			.select({ id: sessions.id })
			.from(sessions)
			.where(
				and(eq(sessions.campaignId, campaign.id), eq(sessions.sessionNumber, originalSessionNumber))
			)
			.limit(1);

		const session = sessionResults[0];

		if (!session) {
			error(404, 'Session not found.');
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
		const sessionNumber = parseSessionNumber(sessionNumberText);

		if (sessionNumber === null) {
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
			await db
				.update(sessions)
				.set({
					sessionNumber,
					title,
					sessionDate,
					rawNotes,
					updatedAt: new Date()
				})
				.where(eq(sessions.id, session.id));
		} catch (caught) {
			console.error('Session update failed:', caught instanceof Error ? caught.message : caught);

			return fail(409, {
				success: false,
				message: 'That session number may already exist in this campaign.',
				values
			});
		}

		redirect(303, `/campaigns/${campaign.slug}`);
	}
} satisfies Actions;
