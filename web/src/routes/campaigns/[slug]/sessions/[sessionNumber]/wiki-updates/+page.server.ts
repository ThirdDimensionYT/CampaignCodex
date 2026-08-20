import { error, fail, redirect } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';

import { requireCampaignEditor } from '$lib/server/auth/guards';
import {
	campaigns,
	entities,
	entityRevisions,
	entityTypes,
	mentions,
	noteImports,
	sessions
} from '$lib/server/db/schema';
import {
	generateWikiSuggestions,
	WIKI_SUGGESTION_MODEL
} from '$lib/server/wiki-suggestion-generator';
import {
	parseProposedWikiChanges,
	type WikiSuggestion,
	type WikiSuggestionType
} from '$lib/wiki-suggestions';

import type { Actions, PageServerLoad } from './$types';

function parseSessionNumber(value: string): number | null {
	const sessionNumber = Number(value);
	return Number.isInteger(sessionNumber) && sessionNumber > 0 ? sessionNumber : null;
}

function makeSlug(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function isEntityType(value: string): value is WikiSuggestionType {
	return entityTypes.includes(value as WikiSuggestionType);
}

async function getCampaignAndSession(
	db: Awaited<ReturnType<typeof requireCampaignEditor>>,
	campaignSlug: string,
	sessionNumberText: string
) {
	const sessionNumber = parseSessionNumber(sessionNumberText);

	if (sessionNumber === null) {
		error(404, 'Session not found.');
	}

	const campaignResults = await db
		.select()
		.from(campaigns)
		.where(eq(campaigns.slug, campaignSlug))
		.limit(1);
	const campaign = campaignResults[0];

	if (!campaign) {
		error(404, 'Campaign not found.');
	}

	const sessionResults = await db
		.select()
		.from(sessions)
		.where(and(eq(sessions.campaignId, campaign.id), eq(sessions.sessionNumber, sessionNumber)))
		.limit(1);
	const session = sessionResults[0];

	if (!session) {
		error(404, 'Session not found.');
	}

	return { campaign, session };
}

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
	const db = await requireCampaignEditor(platform, cookies, params.slug);
	const { campaign, session } = await getCampaignAndSession(db, params.slug, params.sessionNumber);
	const importResults = await db
		.select()
		.from(noteImports)
		.where(and(eq(noteImports.campaignId, campaign.id), eq(noteImports.sessionId, session.id)))
		.orderBy(desc(noteImports.createdAt))
		.limit(1);
	const latestImport = importResults[0] ?? null;

	return {
		campaign,
		session,
		latestImport: latestImport
			? {
					...latestImport,
					proposedChanges: parseProposedWikiChanges(latestImport.proposedChanges)
				}
			: null
	};
};

export const actions = {
	generate: async ({ cookies, params, platform }) => {
		const db = await requireCampaignEditor(platform, cookies, params.slug);
		const { campaign, session } = await getCampaignAndSession(
			db,
			params.slug,
			params.sessionNumber
		);

		if (!platform) {
			error(500, 'Cloudflare AI binding is unavailable.');
		}

		if (!session.rawNotes.trim()) {
			return fail(400, {
				success: false,
				message: 'Add some session notes before generating wiki updates.'
			});
		}

		const existingEntries = await db
			.select({
				type: entities.type,
				name: entities.name,
				slug: entities.slug,
				summary: entities.summary
			})
			.from(entities)
			.where(eq(entities.campaignId, campaign.id));
		const importId = crypto.randomUUID();

		await db.insert(noteImports).values({
			id: importId,
			campaignId: campaign.id,
			sessionId: session.id,
			rawNotes: session.rawNotes,
			status: 'pending',
			model: WIKI_SUGGESTION_MODEL
		});

		try {
			const proposedChanges = await generateWikiSuggestions(platform.env.AI, {
				campaignName: campaign.name,
				sessionNumber: session.sessionNumber,
				sessionTitle: session.title,
				rawNotes: session.rawNotes,
				existingEntries
			});

			await db
				.update(noteImports)
				.set({ proposedChanges, errorMessage: null })
				.where(eq(noteImports.id, importId));

			return {
				success: true,
				message:
					proposedChanges.suggestions.length === 0
						? 'Analysis finished, but no clear wiki updates were found.'
						: `Generated ${proposedChanges.suggestions.length} suggestion${proposedChanges.suggestions.length === 1 ? '' : 's'} for review.`
			};
		} catch (caught) {
			const errorMessage = caught instanceof Error ? caught.message : 'Unknown AI error';

			console.error('Wiki suggestion generation failed:', errorMessage);
			await db
				.update(noteImports)
				.set({ status: 'failed', errorMessage: errorMessage.slice(0, 2_000) })
				.where(eq(noteImports.id, importId));

			return fail(502, {
				success: false,
				message: 'The notes could not be analysed. Please try again in a moment.'
			});
		}
	},
	apply: async ({ cookies, request, params, platform }) => {
		const db = await requireCampaignEditor(platform, cookies, params.slug);
		const { campaign, session } = await getCampaignAndSession(
			db,
			params.slug,
			params.sessionNumber
		);
		const formData = await request.formData();
		const importId = String(formData.get('importId') ?? '').trim();
		const importResults = await db
			.select()
			.from(noteImports)
			.where(
				and(
					eq(noteImports.id, importId),
					eq(noteImports.campaignId, campaign.id),
					eq(noteImports.sessionId, session.id),
					eq(noteImports.status, 'pending')
				)
			)
			.limit(1);
		const noteImport = importResults[0];
		const proposedChanges = parseProposedWikiChanges(noteImport?.proposedChanges);

		if (!noteImport || !proposedChanges) {
			return fail(404, {
				success: false,
				message: 'These suggestions are no longer available for approval.'
			});
		}

		const selected: Array<{ original: WikiSuggestion; edited: WikiSuggestion }> = [];

		for (const [index, original] of proposedChanges.suggestions.entries()) {
			if (formData.get(`selected-${index}`) !== 'on') {
				continue;
			}

			const type = String(formData.get(`type-${index}`) ?? original.type);
			const name = String(formData.get(`name-${index}`) ?? original.name).trim();
			const summary = String(formData.get(`summary-${index}`) ?? '').trim();
			const content = String(formData.get(`content-${index}`) ?? '').trim();

			if (!isEntityType(type) || !name || !summary || !content) {
				return fail(400, {
					success: false,
					message: `Suggestion ${index + 1} needs a valid type, name, summary, and content.`
				});
			}

			selected.push({
				original,
				edited: {
					...original,
					type,
					name: name.slice(0, 160),
					summary: summary.slice(0, 1_000),
					content: content.slice(0, 12_000)
				}
			});
		}

		if (selected.length === 0) {
			return fail(400, {
				success: false,
				message: 'Select at least one suggestion to add to the wiki.'
			});
		}

		for (const { original, edited } of selected) {
			if (original.action === 'create') {
				const slug = makeSlug(edited.name);

				if (!slug) {
					return fail(400, {
						success: false,
						message: `“${edited.name}” needs a name containing letters or numbers.`
					});
				}

				const duplicates = await db
					.select({ id: entities.id })
					.from(entities)
					.where(and(eq(entities.campaignId, campaign.id), eq(entities.slug, slug)))
					.limit(1);

				if (duplicates[0]) {
					return fail(409, {
						success: false,
						message: `A wiki entry named “${edited.name}” already exists. Deselect it or update the existing entry manually.`
					});
				}
			} else {
				const existing = await db
					.select({ id: entities.id })
					.from(entities)
					.where(
						and(
							eq(entities.campaignId, campaign.id),
							eq(entities.slug, original.existingSlug ?? '')
						)
					)
					.limit(1);

				if (!existing[0]) {
					return fail(409, {
						success: false,
						message: `The existing wiki entry for “${original.name}” could not be found.`
					});
				}
			}
		}

		for (const { original, edited } of selected) {
			let entityId: string;

			if (original.action === 'create') {
				entityId = crypto.randomUUID();
				await db.insert(entities).values({
					id: entityId,
					campaignId: campaign.id,
					type: edited.type,
					name: edited.name,
					slug: makeSlug(edited.name),
					summary: edited.summary,
					content: edited.content,
					firstSessionId: session.id
				});
			} else {
				const existingResults = await db
					.select()
					.from(entities)
					.where(
						and(
							eq(entities.campaignId, campaign.id),
							eq(entities.slug, original.existingSlug ?? '')
						)
					)
					.limit(1);
				const existing = existingResults[0];

				if (!existing) {
					continue;
				}

				entityId = existing.id;
				await db.insert(entityRevisions).values({
					entityId,
					sessionId: session.id,
					summary: existing.summary,
					content: existing.content,
					changeReason: `Before applying Session ${session.sessionNumber} AI suggestion`
				});

				const updateHeading = `Session ${session.sessionNumber} update`;
				const content = existing.content.includes(edited.content)
					? existing.content
					: `${existing.content}${existing.content ? '\n\n' : ''}## ${updateHeading}\n${edited.content}`;

				await db
					.update(entities)
					.set({ summary: edited.summary, content, updatedAt: new Date() })
					.where(eq(entities.id, entityId));
			}

			await db
				.insert(mentions)
				.values({
					sessionId: session.id,
					entityId,
					context: edited.reason
				})
				.onConflictDoNothing();
		}

		await db
			.update(noteImports)
			.set({ status: 'approved', reviewedAt: new Date() })
			.where(eq(noteImports.id, noteImport.id));

		redirect(303, `/campaigns/${campaign.slug}/wiki`);
	},
	discard: async ({ cookies, request, params, platform }) => {
		const db = await requireCampaignEditor(platform, cookies, params.slug);
		const { campaign, session } = await getCampaignAndSession(
			db,
			params.slug,
			params.sessionNumber
		);
		const formData = await request.formData();
		const importId = String(formData.get('importId') ?? '').trim();

		await db
			.update(noteImports)
			.set({ status: 'rejected', reviewedAt: new Date() })
			.where(
				and(
					eq(noteImports.id, importId),
					eq(noteImports.campaignId, campaign.id),
					eq(noteImports.sessionId, session.id),
					eq(noteImports.status, 'pending')
				)
			);

		return {
			success: true,
			message: 'The suggestions were discarded. You can generate a fresh set at any time.'
		};
	}
} satisfies Actions;
