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
