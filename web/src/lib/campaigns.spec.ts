import { describe, expect, it } from 'vitest';

import { getCampaignLandingPath, isArmouryEntityType } from './campaigns';

describe('campaign kinds', () => {
	it('uses the existing wiki landing page for campaigns', () => {
		expect(getCampaignLandingPath({ slug: 'the-shattered-crown', kind: 'campaign' })).toBe(
			'/campaigns/the-shattered-crown/wiki'
		);
	});

	it('uses the armoury landing page for armouries', () => {
		expect(getCampaignLandingPath({ slug: 'guild-armoury', kind: 'armoury' })).toBe(
			'/campaigns/guild-armoury/armoury'
		);
	});

	it('only allows armoury entry types', () => {
		expect(['item', 'character', 'npc'].every(isArmouryEntityType)).toBe(true);
		expect(['location', 'faction', 'quest', 'other'].some(isArmouryEntityType)).toBe(false);
	});
});
