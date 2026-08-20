import { error, fail } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';

import { requireCampaignAccess, requireCampaignEditor } from '$lib/server/auth/guards';
import { campaignMaps, campaigns, entities, mapMarkers } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

const MAX_MAP_FILE_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_REQUEST_BYTES = MAX_MAP_FILE_BYTES + 1024 * 1024;
const allowedImageTypes = new Map([
	['image/jpeg', 'jpg'],
	['image/png', 'png'],
	['image/webp', 'webp']
]);

export const load: PageServerLoad = async ({ cookies, params, platform }) => {
	const { db, campaign } = await requireCampaignAccess(platform, cookies, params.slug);
	const mapResults = await db
		.select()
		.from(campaignMaps)
		.where(eq(campaignMaps.campaignId, campaign.id))
		.orderBy(desc(campaignMaps.updatedAt))
		.limit(1);
	const campaignMap = mapResults[0] ?? null;
	const locations = await db
		.select({ id: entities.id, name: entities.name, slug: entities.slug })
		.from(entities)
		.where(and(eq(entities.campaignId, campaign.id), eq(entities.type, 'location')))
		.orderBy(asc(entities.name));

	const markers = campaignMap
		? await db
				.select({
					id: mapMarkers.id,
					entityId: entities.id,
					name: entities.name,
					slug: entities.slug,
					summary: entities.summary,
					positionX: mapMarkers.positionX,
					positionY: mapMarkers.positionY
				})
				.from(mapMarkers)
				.innerJoin(entities, eq(mapMarkers.entityId, entities.id))
				.where(eq(mapMarkers.mapId, campaignMap.id))
				.orderBy(asc(entities.name))
		: [];

	return {
		campaign,
		campaignMap: campaignMap
			? {
					id: campaignMap.id,
					name: campaignMap.name,
					originalFilename: campaignMap.originalFilename,
					sizeBytes: campaignMap.sizeBytes,
					updatedAt: campaignMap.updatedAt
				}
			: null,
		locations,
		markers
	};
};

export const actions = {
	upload: async ({ cookies, params, platform, request }) => {
		if (!platform) {
			error(500, 'Cloudflare bindings are unavailable.');
		}

		const contentLength = Number(request.headers.get('content-length') ?? 0);

		if (contentLength > MAX_UPLOAD_REQUEST_BYTES) {
			return fail(413, {
				success: false,
				section: 'upload' as const,
				message: 'The map image must be no larger than 10 MB.'
			});
		}

		const db = await requireCampaignEditor(platform, cookies, params.slug);
		const campaignResults = await db
			.select({ id: campaigns.id, slug: campaigns.slug })
			.from(campaigns)
			.where(eq(campaigns.slug, params.slug))
			.limit(1);
		const campaign = campaignResults[0];

		if (!campaign) {
			error(404, 'Campaign not found.');
		}

		const formData = await request.formData();
		const image = formData.get('mapImage');
		const name = String(formData.get('name') ?? '').trim() || 'Regional map';

		if (name.length > 100) {
			return fail(400, {
				success: false,
				section: 'upload' as const,
				message: 'The map name must be no more than 100 characters.'
			});
		}

		if (!(image instanceof File) || image.size === 0) {
			return fail(400, {
				success: false,
				section: 'upload' as const,
				message: 'Choose a PNG, JPEG or WebP map image.'
			});
		}

		const extension = allowedImageTypes.get(image.type);

		if (!extension) {
			return fail(415, {
				success: false,
				section: 'upload' as const,
				message: 'Map images must be PNG, JPEG or WebP files.'
			});
		}

		if (image.size > MAX_MAP_FILE_BYTES) {
			return fail(413, {
				success: false,
				section: 'upload' as const,
				message: 'The map image must be no larger than 10 MB.'
			});
		}

		const existingResults = await db
			.select()
			.from(campaignMaps)
			.where(eq(campaignMaps.campaignId, campaign.id))
			.orderBy(desc(campaignMaps.updatedAt))
			.limit(1);
		const existingMap = existingResults[0];
		const objectKey = `campaigns/${campaign.id}/maps/${crypto.randomUUID()}.${extension}`;

		try {
			await platform.env.MAPS.put(objectKey, image.stream(), {
				httpMetadata: {
					contentType: image.type,
					cacheControl: 'private, max-age=3600'
				},
				customMetadata: {
					campaignId: campaign.id
				}
			});

			if (existingMap) {
				await db
					.update(campaignMaps)
					.set({
						name,
						objectKey,
						originalFilename: image.name,
						contentType: image.type,
						sizeBytes: image.size,
						updatedAt: new Date()
					})
					.where(eq(campaignMaps.id, existingMap.id));
			} else {
				await db.insert(campaignMaps).values({
					campaignId: campaign.id,
					name,
					objectKey,
					originalFilename: image.name,
					contentType: image.type,
					sizeBytes: image.size
				});
			}
		} catch (caught) {
			await platform.env.MAPS.delete(objectKey).catch((cleanupError) => {
				console.error(
					JSON.stringify({
						message: 'Failed to clean up an incomplete map upload',
						error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
						campaignId: campaign.id,
						objectKey
					})
				);
			});
			console.error(
				JSON.stringify({
					message: 'Map upload failed',
					error: caught instanceof Error ? caught.message : String(caught),
					campaignId: campaign.id
				})
			);

			return fail(500, {
				success: false,
				section: 'upload' as const,
				message: 'The map could not be uploaded. Please try again.'
			});
		}

		if (existingMap?.objectKey && existingMap.objectKey !== objectKey) {
			await platform.env.MAPS.delete(existingMap.objectKey).catch((caught) => {
				console.error(
					JSON.stringify({
						message: 'Previous map cleanup failed',
						error: caught instanceof Error ? caught.message : String(caught),
						campaignId: campaign.id,
						objectKey: existingMap.objectKey
					})
				);
			});
		}

		return {
			success: true,
			section: 'upload' as const,
			message: existingMap ? 'Campaign map replaced successfully.' : 'Campaign map uploaded.'
		};
	},
	saveMarker: async ({ cookies, params, platform, request }) => {
		const db = await requireCampaignEditor(platform, cookies, params.slug);
		const formData = await request.formData();
		const entityId = String(formData.get('entityId') ?? '').trim();
		const positionX = Number(formData.get('positionX'));
		const positionY = Number(formData.get('positionY'));

		if (
			!Number.isInteger(positionX) ||
			!Number.isInteger(positionY) ||
			positionX < 0 ||
			positionX > 10_000 ||
			positionY < 0 ||
			positionY > 10_000
		) {
			return fail(400, {
				success: false,
				section: 'marker' as const,
				message: 'Click a valid position on the map before saving the marker.'
			});
		}

		const campaignResults = await db
			.select({ id: campaigns.id })
			.from(campaigns)
			.where(eq(campaigns.slug, params.slug))
			.limit(1);
		const campaign = campaignResults[0];

		if (!campaign) {
			error(404, 'Campaign not found.');
		}

		const mapResults = await db
			.select({ id: campaignMaps.id })
			.from(campaignMaps)
			.where(eq(campaignMaps.campaignId, campaign.id))
			.orderBy(desc(campaignMaps.updatedAt))
			.limit(1);
		const campaignMap = mapResults[0];

		if (!campaignMap) {
			return fail(409, {
				success: false,
				section: 'marker' as const,
				message: 'Upload a campaign map before adding markers.'
			});
		}

		const locationResults = await db
			.select({ id: entities.id, name: entities.name })
			.from(entities)
			.where(
				and(
					eq(entities.id, entityId),
					eq(entities.campaignId, campaign.id),
					eq(entities.type, 'location')
				)
			)
			.limit(1);
		const location = locationResults[0];

		if (!location) {
			return fail(400, {
				success: false,
				section: 'marker' as const,
				message: 'Choose a valid Location wiki entry.'
			});
		}

		await db
			.insert(mapMarkers)
			.values({
				mapId: campaignMap.id,
				entityId: location.id,
				positionX,
				positionY
			})
			.onConflictDoUpdate({
				target: [mapMarkers.mapId, mapMarkers.entityId],
				set: {
					positionX,
					positionY,
					updatedAt: new Date()
				}
			});

		return {
			success: true,
			section: 'marker' as const,
			message: `Marker saved for ${location.name}.`
		};
	},
	removeMarker: async ({ cookies, params, platform, request }) => {
		const db = await requireCampaignEditor(platform, cookies, params.slug);
		const formData = await request.formData();
		const markerId = String(formData.get('markerId') ?? '').trim();
		const markerResults = await db
			.select({ id: mapMarkers.id, name: entities.name })
			.from(mapMarkers)
			.innerJoin(campaignMaps, eq(mapMarkers.mapId, campaignMaps.id))
			.innerJoin(campaigns, eq(campaignMaps.campaignId, campaigns.id))
			.innerJoin(entities, eq(mapMarkers.entityId, entities.id))
			.where(and(eq(mapMarkers.id, markerId), eq(campaigns.slug, params.slug)))
			.limit(1);
		const marker = markerResults[0];

		if (!marker) {
			return fail(404, {
				success: false,
				section: 'marker' as const,
				message: 'That map marker could not be found.'
			});
		}

		await db.delete(mapMarkers).where(eq(mapMarkers.id, marker.id));

		return {
			success: true,
			section: 'marker' as const,
			message: `Marker removed for ${marker.name}.`
		};
	}
} satisfies Actions;
