export const wikiSuggestionTypes = [
	'character',
	'npc',
	'location',
	'faction',
	'item',
	'quest',
	'other'
] as const;

export type WikiSuggestionType = (typeof wikiSuggestionTypes)[number];
export type WikiSuggestionAction = 'create' | 'update';

export type WikiSuggestion = {
	action: WikiSuggestionAction;
	existingSlug: string | null;
	type: WikiSuggestionType;
	name: string;
	summary: string;
	content: string;
	reason: string;
};

export type ProposedWikiChanges = {
	suggestions: WikiSuggestion[];
};

export type ExistingWikiEntryAiPatch = {
	content: string;
};

type ExistingWikiReference = {
	name: string;
	slug: string;
};

function normalizeForMention(value: string): string {
	return value
		.normalize('NFKD')
		.toLocaleLowerCase('en-GB')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

export function hasSourceMention(
	suggestion: WikiSuggestion,
	sourceNotes: string,
	existingEntries: ExistingWikiReference[]
): boolean {
	const normalizedNotes = ` ${normalizeForMention(sourceNotes)} `;
	const possibleNames = [suggestion.name];

	if (suggestion.existingSlug) {
		const existingName = existingEntries.find(
			(entry) => entry.slug === suggestion.existingSlug
		)?.name;

		if (existingName) {
			possibleNames.push(existingName);
		}
	}

	return possibleNames.some((name) => {
		const normalizedName = normalizeForMention(name);
		return normalizedName.length > 0 && normalizedNotes.includes(` ${normalizedName} `);
	});
}

export function buildExistingWikiEntryAiPatch(
	existingContent: string,
	suggestedContent: string,
	sessionNumber: number
): ExistingWikiEntryAiPatch {
	if (existingContent.includes(suggestedContent)) {
		return { content: existingContent };
	}

	const separator = existingContent ? '\n\n' : '';

	return {
		content: `${existingContent}${separator}## Session ${sessionNumber} update\n${suggestedContent}`
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, maximumLength: number): string | null {
	if (typeof value !== 'string') {
		return null;
	}

	const cleaned = value.trim();
	return cleaned ? cleaned.slice(0, maximumLength) : null;
}

export function parseProposedWikiChanges(value: unknown): ProposedWikiChanges | null {
	if (!isRecord(value) || !Array.isArray(value.suggestions)) {
		return null;
	}

	const suggestions: WikiSuggestion[] = [];

	for (const candidate of value.suggestions.slice(0, 50)) {
		if (!isRecord(candidate)) {
			continue;
		}

		const action = candidate.action;
		const type = candidate.type;
		const name = cleanText(candidate.name, 160);
		const summary = cleanText(candidate.summary, 1_000);
		const content = cleanText(candidate.content, 12_000);
		const reason = cleanText(candidate.reason, 1_000);
		const existingSlug =
			typeof candidate.existingSlug === 'string' && candidate.existingSlug.trim()
				? candidate.existingSlug.trim().slice(0, 200)
				: null;

		if (
			(action !== 'create' && action !== 'update') ||
			typeof type !== 'string' ||
			!wikiSuggestionTypes.includes(type as WikiSuggestionType) ||
			!name ||
			!summary ||
			!content ||
			!reason ||
			(action === 'update' && !existingSlug)
		) {
			continue;
		}

		suggestions.push({
			action,
			existingSlug,
			type: type as WikiSuggestionType,
			name,
			summary,
			content,
			reason
		});
	}

	return { suggestions };
}
