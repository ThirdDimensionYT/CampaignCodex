import type { campaignKinds } from '$lib/server/db/schema';

export type CampaignKind = (typeof campaignKinds)[number];

export const armouryEntityTypes = ['item', 'character', 'npc'] as const;
export type ArmouryEntityType = (typeof armouryEntityTypes)[number];

export function isArmouryEntityType(value: string | null): value is ArmouryEntityType {
	return value !== null && armouryEntityTypes.includes(value as ArmouryEntityType);
}

export function getCampaignLandingPath(campaign: { slug: string; kind: CampaignKind }): string {
	return campaign.kind === 'armoury'
		? `/campaigns/${campaign.slug}/armoury`
		: `/campaigns/${campaign.slug}/wiki`;
}
