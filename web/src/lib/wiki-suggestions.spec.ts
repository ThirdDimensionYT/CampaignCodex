import { describe, expect, it } from 'vitest';

import {
	buildExistingWikiEntryAiPatch,
	hasSourceMention,
	parseProposedWikiChanges
} from './wiki-suggestions';

describe('parseProposedWikiChanges', () => {
	it('accepts valid create and update suggestions', () => {
		const parsed = parseProposedWikiChanges({
			suggestions: [
				{
					action: 'create',
					existingSlug: null,
					type: 'npc',
					name: 'Brother Aldric',
					summary: 'A priest at the ruined chapel.',
					content: 'Brother Aldric offered to help the party.',
					reason: 'Introduced during the session.'
				},
				{
					action: 'update',
					existingSlug: 'blackstone-keep',
					type: 'location',
					name: 'Blackstone Keep',
					summary: 'A ruined keep with a sealed lower entrance.',
					content: 'The party found a sealed entrance beneath the western tower.',
					reason: 'New information was discovered.'
				}
			]
		});

		expect(parsed?.suggestions).toHaveLength(2);
		expect(parsed?.suggestions[1].existingSlug).toBe('blackstone-keep');
	});

	it('drops malformed suggestions instead of trusting model output', () => {
		const parsed = parseProposedWikiChanges({
			suggestions: [
				{
					action: 'delete',
					type: 'secret',
					name: 'Unsafe change'
				}
			]
		});

		expect(parsed).toEqual({ suggestions: [] });
	});
});

describe('hasSourceMention', () => {
	it('rejects an entity name that does not occur in the session notes', () => {
		expect(
			hasSourceMention(
				{
					action: 'create',
					existingSlug: null,
					type: 'location',
					name: 'Radiant Hall',
					summary: 'A hall',
					content: 'A hall',
					reason: 'Suggested by the model'
				},
				'Kellen travelled to Blackstone Keep.',
				[]
			)
		).toBe(false);
	});

	it('accepts the suggested or existing entry name when it occurs in the notes', () => {
		expect(
			hasSourceMention(
				{
					action: 'update',
					existingSlug: 'kellen',
					type: 'character',
					name: 'Kellen',
					summary: 'A player character',
					content: 'Cast detect magic.',
					reason: 'Kellen acted in the session'
				},
				'Kellen casts Detect Magic near the gate.',
				[{ name: 'Kellen', slug: 'kellen' }]
			)
		).toBe(true);
	});
});

describe('buildExistingWikiEntryAiPatch', () => {
	it('only returns content and cannot replace an existing short summary', () => {
		const patch = buildExistingWikiEntryAiPatch(
			'Kellen is a player character.',
			'Kellen cast Detect Magic at the gate.',
			26
		);

		expect(patch).toEqual({
			content:
				'Kellen is a player character.\n\n## Session 26 update\nKellen cast Detect Magic at the gate.'
		});
		expect(patch).not.toHaveProperty('summary');
	});

	it('does not append the same information twice', () => {
		const existing =
			'Kellen is a player character.\n\n## Session 26 update\nKellen cast Detect Magic at the gate.';

		expect(
			buildExistingWikiEntryAiPatch(existing, 'Kellen cast Detect Magic at the gate.', 26)
		).toEqual({ content: existing });
	});
});
