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

	let {
		suggestion,
		index,
		existingEntries
	}: { suggestion: WikiSuggestion; index: number; existingEntries: ExistingEntry[] } = $props();

	let updateExisting = $state(false);
	let existingSlug = $state('');

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
		<label class="mt-4 block">
			<span class="mb-1 block font-medium">Entry to update</span>
			<select
				name={`existingSlug-${index}`}
				bind:value={existingSlug}
				required
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
			>
				<option value="">Select an existing entry</option>
				{#each existingEntries as entry (entry.slug)}
					<option value={entry.slug}>
						{entry.name} ({getEntityTypeLabel(entry.type)})
					</option>
				{/each}
			</select>
			<span class="mt-1 block text-sm text-gray-500 dark:text-gray-400">
				The selected entry keeps its current name, type, and summary.
			</span>
		</label>
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
