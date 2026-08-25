import { error } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';

import { requireCampaignAccess } from '$lib/server/auth/guards';
import { campaignMaps } from '$lib/server/db/schema';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, params, platform }) => {
	if (!platform) {
		error(500, 'Cloudflare storage binding is unavailable.');
	}

	const { db, campaign } = await requireCampaignAccess(platform, cookies, params.slug);

	if (campaign.kind === 'armoury') {
		error(404, 'Maps are not available for armouries.');
	}

	const mapResults = await db
		.select({ objectKey: campaignMaps.objectKey })
		.from(campaignMaps)
		.where(eq(campaignMaps.campaignId, campaign.id))
		.orderBy(desc(campaignMaps.updatedAt))
		.limit(1);
	const campaignMap = mapResults[0];

	if (!campaignMap) {
		error(404, 'Campaign map not found.');
	}

	const object = await platform.env.MAPS.get(campaignMap.objectKey);

	if (!object) {
		error(404, 'Campaign map image not found.');
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	headers.set('cache-control', 'private, max-age=3600');
	headers.set('x-content-type-options', 'nosniff');

	return new Response(object.body, { headers });
};
