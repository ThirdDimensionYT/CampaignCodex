<script lang="ts">
	import { getEntityTypeLabel } from '$lib/entity-types';
	import {
		wikiSuggestionTypes,
		type WikiSuggestion,
		type WikiSuggestionType
	} from '$lib/wiki-suggestions';

	type ExistingEntry = {
		type: WikiSuggestionType;
		name: string;
		slug: string;
	};

	const entryFilters = [
		{ value: 'all', label: 'All' },
		{ value: 'character', label: 'Player Characters' },
		{ value: 'npc', label: 'NPCs' },
		{ value: 'location', label: 'Locations' },
		{ value: 'faction', label: 'Factions' },
		{ value: 'item', label: 'Items' },
		{ value: 'quest', label: 'Quests' },
		{ value: 'other', label: 'Other' }
	] as const;

	type EntryFilter = (typeof entryFilters)[number]['value'];

	let {
		suggestion,
		index,
		existingEntries
	}: { suggestion: WikiSuggestion; index: number; existingEntries: ExistingEntry[] } = $props();

	let updateExisting = $state(false);
	let existingSlug = $state('');
	let entryFilter = $state<EntryFilter>('all');
	let entrySearch = $state('');

	let filteredEntries = $derived(
		existingEntries.filter((entry) => {
			const matchesType = entryFilter === 'all' || entry.type === entryFilter;
			const query = entrySearch.trim().toLocaleLowerCase('en-GB');
			return matchesType && (!query || entry.name.toLocaleLowerCase('en-GB').includes(query));
		})
	);

	let selectedEntry = $derived(existingEntries.find((entry) => entry.slug === existingSlug));

	$effect.pre(() => {
		if (!existingSlug && suggestion.existingSlug) {
			existingSlug = suggestion.existingSlug;
		}
	});
</script>

<article class="rounded-lg border border-gray-200 p-5 dark:border-gray-700 dark:bg-gray-900">
	<label class="flex items-start gap-3">
		<input
			type="checkbox"
			name={`selected-${index}`}
			checked
			class="mt-1 h-5 w-5 rounded border-gray-300 text-purple-700"
		/>
		<span>
			<span class="font-semibold">Include this suggestion</span>
			<span class="mt-1 block text-sm text-gray-500 dark:text-gray-400">
				{suggestion.reason}
			</span>
		</span>
	</label>

	<div class="mt-5 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
		<label class="flex cursor-pointer items-center justify-between gap-4">
			<span>
				<span class="block font-medium">Update an existing entry</span>
				<span class="mt-1 block text-sm text-gray-500 dark:text-gray-400">
					Off by default. Turn this on to choose where the new information should be added.
				</span>
			</span>
			<input
				type="checkbox"
				bind:checked={updateExisting}
				class="h-5 w-5 shrink-0 rounded border-gray-300 text-purple-700"
			/>
		</label>
		<input type="hidden" name={`action-${index}`} value={updateExisting ? 'update' : 'create'} />
	</div>

	{#if updateExisting}
		<fieldset class="mt-4 space-y-4">
			<legend class="font-medium">Entry to update</legend>
			<input type="hidden" name={`existingSlug-${index}`} value={existingSlug} />

			{#if selectedEntry}
				<div
					class="rounded border border-purple-300 bg-purple-50 p-3 text-sm dark:border-purple-700 dark:bg-purple-950"
				>
					<span class="font-medium">Selected:</span>
					{selectedEntry.name}
					<span class="text-purple-700 dark:text-purple-300">
						({getEntityTypeLabel(selectedEntry.type)})
					</span>
				</div>
			{:else}
				<p class="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
					Choose the wiki entry that should receive this information.
				</p>
			{/if}

			<label class="block">
				<span class="mb-1 block text-sm font-medium">Search by entry name</span>
				<input
					type="search"
					bind:value={entrySearch}
					placeholder="Start typing a name…"
					class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
				/>
			</label>

			<div class="flex flex-wrap gap-2" role="group" aria-label="Filter entries by type">
				{#each entryFilters as filter (filter.value)}
					<button
						type="button"
						onclick={() => (entryFilter = filter.value)}
						aria-pressed={entryFilter === filter.value}
						class="rounded-full border px-3 py-1.5 text-sm font-medium"
						class:border-purple-700={entryFilter === filter.value}
						class:bg-purple-700={entryFilter === filter.value}
						class:text-white={entryFilter === filter.value}
						class:border-gray-300={entryFilter !== filter.value}
						class:hover:bg-gray-50={entryFilter !== filter.value}
						class:dark:border-gray-700={entryFilter !== filter.value}
						class:dark:hover:bg-gray-800={entryFilter !== filter.value}
					>
						{filter.label}
					</button>
				{/each}
			</div>

			<p class="text-sm text-gray-600 dark:text-gray-300">
				Showing {filteredEntries.length} of {existingEntries.length} entries
			</p>

			{#if filteredEntries.length === 0}
				<p
					class="rounded border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
				>
					No entries match that name and category.
				</p>
			{:else}
				<div
					class="max-h-64 space-y-2 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-700"
				>
					{#each filteredEntries as entry (entry.slug)}
						<label
							class="flex cursor-pointer items-center gap-3 rounded p-3 hover:bg-purple-50 dark:hover:bg-gray-800"
							class:bg-purple-100={existingSlug === entry.slug}
							class:dark:bg-purple-950={existingSlug === entry.slug}
						>
							<input
								type="radio"
								name={`entryChoice-${index}`}
								value={entry.slug}
								bind:group={existingSlug}
								class="h-4 w-4 shrink-0 border-gray-300 text-purple-700"
							/>
							<span>
								<span class="block font-medium">{entry.name}</span>
								<span class="block text-xs text-gray-500 dark:text-gray-400">
									{getEntityTypeLabel(entry.type)}
								</span>
							</span>
						</label>
					{/each}
				</div>
			{/if}

			<p class="text-sm text-gray-500 dark:text-gray-400">
				Only the new information below will be appended. The selected entry's name, type, and short
				summary cannot be changed here.
			</p>
		</fieldset>
	{:else}
		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<label class="block">
				<span class="mb-1 block font-medium">Entry type</span>
				<select
					name={`type-${index}`}
					class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
				>
					{#each wikiSuggestionTypes as type (type)}
						<option value={type} selected={type === suggestion.type}>
							{getEntityTypeLabel(type)}
						</option>
					{/each}
				</select>
			</label>

			<label class="block">
				<span class="mb-1 block font-medium">Name</span>
				<input
					type="text"
					name={`name-${index}`}
					value={suggestion.name}
					required
					class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
				/>
			</label>
		</div>

		<label class="mt-4 block">
			<span class="mb-1 block font-medium">Short summary</span>
			<textarea
				name={`summary-${index}`}
				rows="2"
				required
				value={suggestion.summary}
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
			></textarea>
		</label>
	{/if}

	<label class="mt-4 block">
		<span class="mb-1 block font-medium">
			{updateExisting ? 'New information to add' : 'Wiki content'}
		</span>
		<textarea
			name={`content-${index}`}
			rows="5"
			required
			value={suggestion.content}
			class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
		></textarea>
	</label>
</article>
