import { error, fail } from '@sveltejs/kit';
import { and, asc, eq, inArray } from 'drizzle-orm';

import { requireCampaignAccess } from '$lib/server/auth/guards';
import { armouryCheckouts, entities } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

async function getArmoury(
	platform: App.Platform | undefined,
	cookies: Parameters<typeof requireCampaignAccess>[1],
	slug: string
) {
	const result = await requireCampaignAccess(platform, cookies, slug);

	if (result.campaign.kind !== 'armoury') {
		error(404, 'Armoury not found.');
	}

	return result;
}

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
	const { db, campaign } = await getArmoury(platform, cookies, params.slug);
	const entryList = await db
		.select()
		.from(entities)
		.where(
			and(
				eq(entities.campaignId, campaign.id),
				inArray(entities.type, ['item', 'character', 'npc'])
			)
		)
		.orderBy(asc(entities.name));
	const checkoutList = await db
		.select()
		.from(armouryCheckouts)
		.where(eq(armouryCheckouts.campaignId, campaign.id));
	const characters = entryList.filter((entry) => entry.type === 'character');
	const characterNames = new Map(characters.map((character) => [character.id, character.name]));
	const checkoutsByItem = new Map(
		checkoutList.map((checkout) => [
			checkout.itemEntityId,
			{
				characterId: checkout.characterEntityId,
				characterName: characterNames.get(checkout.characterEntityId) ?? 'Unknown character',
				checkedOutAt: checkout.checkedOutAt
			}
		])
	);

	return {
		campaign,
		characters,
		npcs: entryList.filter((entry) => entry.type === 'npc'),
		items: entryList
			.filter((entry) => entry.type === 'item')
			.map((item) => ({ ...item, checkout: checkoutsByItem.get(item.id) ?? null }))
	};
};

export const actions = {
	checkout: async ({ cookies, params, platform, request }) => {
		const { db, campaign } = await getArmoury(platform, cookies, params.slug);
		const formData = await request.formData();
		const itemId = String(formData.get('itemId') ?? '').trim();
		const characterId = String(formData.get('characterId') ?? '').trim();

		const [itemResults, characterResults] = await Promise.all([
			db
				.select({ id: entities.id })
				.from(entities)
				.where(
					and(
						eq(entities.id, itemId),
						eq(entities.campaignId, campaign.id),
						eq(entities.type, 'item')
					)
				)
				.limit(1),
			db
				.select({ id: entities.id, name: entities.name })
				.from(entities)
				.where(
					and(
						eq(entities.id, characterId),
						eq(entities.campaignId, campaign.id),
						eq(entities.type, 'character')
					)
				)
				.limit(1)
		]);
		const item = itemResults[0];
		const character = characterResults[0];

		if (!item || !character) {
			return fail(400, {
				success: false,
				message: 'Select a valid available item and Player Character.'
			});
		}

		try {
			await db.insert(armouryCheckouts).values({
				itemEntityId: item.id,
				campaignId: campaign.id,
				characterEntityId: character.id
			});
		} catch (caught) {
			console.error(
				JSON.stringify({
					message: 'Armoury checkout failed',
					error: caught instanceof Error ? caught.message : String(caught),
					campaignId: campaign.id,
					itemId
				})
			);

			return fail(409, {
				success: false,
				message: 'That item has already been checked out.'
			});
		}

		return {
			success: true,
			message: `Item checked out by ${character.name}.`
		};
	},
	returnItem: async ({ cookies, params, platform, request }) => {
		const { db, campaign } = await getArmoury(platform, cookies, params.slug);
		const formData = await request.formData();
		const itemId = String(formData.get('itemId') ?? '').trim();
		const itemResults = await db
			.select({ id: entities.id })
			.from(entities)
			.where(
				and(
					eq(entities.id, itemId),
					eq(entities.campaignId, campaign.id),
					eq(entities.type, 'item')
				)
			)
			.limit(1);

		if (!itemResults[0]) {
			return fail(404, { success: false, message: 'That armoury item could not be found.' });
		}

		await db
			.delete(armouryCheckouts)
			.where(
				and(eq(armouryCheckouts.itemEntityId, itemId), eq(armouryCheckouts.campaignId, campaign.id))
			);

		return { success: true, message: 'Item marked as returned and is available again.' };
	}
} satisfies Actions;
