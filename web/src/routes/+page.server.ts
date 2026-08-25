import { error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { requireOwner } from '$lib/server/auth/guards';

import { getDb } from '$lib/server/db';
import { campaignKinds, campaignMaps, campaigns } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

function makeSlug(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

type CampaignKind = (typeof campaignKinds)[number];

function isCampaignKind(value: string): value is CampaignKind {
	return campaignKinds.includes(value as CampaignKind);
}

function openDatabase(platform: App.Platform | undefined) {
	if (!platform) {
		throw new Error('Cloudflare bindings are not available. Run the app with npm run preview.');
	}

	return getDb(platform.env.DB);
}

export const load: PageServerLoad = async ({ platform }) => {
	const db = openDatabase(platform);

	const campaignsList = await db.select().from(campaigns).orderBy(asc(campaigns.name));

	return {
		campaigns: campaignsList
	};
};

export const actions = {
	create: async ({ cookies, request, platform }) => {
		const db = await requireOwner(platform, cookies);
		const formData = await request.formData();

		const name = String(formData.get('name') ?? '').trim();
		const description = String(formData.get('description') ?? '').trim();
		const kindText = String(formData.get('kind') ?? 'campaign');
		const kind = isCampaignKind(kindText) ? kindText : 'campaign';

		if (!name) {
			return fail(400, {
				success: false,
				message: 'Please enter a campaign name.',
				values: { name, description, kind }
			});
		}

		const slug = makeSlug(name);

		if (!slug) {
			return fail(400, {
				success: false,
				message: 'The campaign name must contain letters or numbers.',
				values: { name, description, kind }
			});
		}

		try {
			await db.insert(campaigns).values({
				name,
				slug,
				kind,
				description
			});
		} catch (error) {
			console.error('Campaign creation failed:', error instanceof Error ? error.message : error);

			return fail(409, {
				success: false,
				message: 'A campaign with that name already exists.',
				values: { name, description, kind }
			});
		}

		return {
			success: true,
			message: `${kind === 'armoury' ? 'Armoury' : 'Campaign'} created successfully.`,
			values: { name: '', description: '', kind: 'campaign' as const }
		};
	},
	delete: async ({ cookies, request, platform }) => {
		if (!platform) {
			error(500, 'Cloudflare bindings are unavailable.');
		}

		const db = await requireOwner(platform, cookies);
		const formData = await request.formData();
		const campaignId = String(formData.get('campaignId') ?? '').trim();
		const campaignResults = await db
			.select({ id: campaigns.id, name: campaigns.name, kind: campaigns.kind })
			.from(campaigns)
			.where(eq(campaigns.id, campaignId))
			.limit(1);
		const campaign = campaignResults[0];

		if (!campaign) {
			return fail(404, {
				success: false,
				message: 'That campaign or armoury could not be found.'
			});
		}

		const mapResults = await db
			.select({ objectKey: campaignMaps.objectKey })
			.from(campaignMaps)
			.where(eq(campaignMaps.campaignId, campaign.id));

		try {
			await db.delete(campaigns).where(eq(campaigns.id, campaign.id));
		} catch (caught) {
			console.error(
				JSON.stringify({
					message: 'Campaign deletion failed',
					error: caught instanceof Error ? caught.message : String(caught),
					campaignId: campaign.id
				})
			);

			return fail(500, {
				success: false,
				message: `${campaign.kind === 'armoury' ? 'The armoury' : 'The campaign'} could not be deleted. Please try again.`
			});
		}

		const mapObjectKeys = mapResults.map((campaignMap) => campaignMap.objectKey);

		if (mapObjectKeys.length > 0) {
			try {
				await platform.env.MAPS.delete(mapObjectKeys);
			} catch (caught) {
				console.error(
					JSON.stringify({
						message: 'Deleted campaign map cleanup failed',
						error: caught instanceof Error ? caught.message : String(caught),
						campaignId: campaign.id,
						objectKeys: mapObjectKeys
					})
				);
			}
		}

		return {
			success: true,
			message: `${campaign.kind === 'armoury' ? 'Armoury' : 'Campaign'} “${campaign.name}” deleted.`
		};
	}
} satisfies Actions;
