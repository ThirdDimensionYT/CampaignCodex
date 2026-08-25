<script lang="ts">
	import { resolve } from '$app/paths';
	import { getEntityTypeLabel } from '$lib/entity-types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const filters = [
		{ value: 'all', label: 'All entries' },
		{ value: 'character', label: 'Player Characters' },
		{ value: 'npc', label: 'NPCs' },
		{ value: 'location', label: 'Locations' },
		{ value: 'faction', label: 'Factions' },
		{ value: 'item', label: 'Items' },
		{ value: 'quest', label: 'Quests' },
		{ value: 'other', label: 'Other' }
	] as const;

	type Filter = (typeof filters)[number]['value'];

	let selectedFilter = $state<Filter>('all');
	let searchQuery = $state('');

	let filteredEntities = $derived(
		data.entities.filter((entity) => {
			const matchesType = selectedFilter === 'all' || entity.type === selectedFilter;
			const query = searchQuery.trim().toLowerCase();
			const searchableText = `${entity.name} ${entity.summary} ${entity.content}`.toLowerCase();

			return matchesType && (!query || searchableText.includes(query));
		})
	);
</script>

<svelte:head>
	<title>Wiki | {data.campaign.name}</title>
	<meta name="description" content={`Browse the ${data.campaign.name} campaign wiki`} />
</svelte:head>

<main class="mx-auto max-w-4xl space-y-8 p-6">
	{#if data.isOwner}
		<a href={resolve('/')} class="text-purple-700 hover:underline dark:text-purple-400">
			← All campaigns and armouries
		</a>
	{/if}

	<header class="border-b border-gray-200 pb-6 dark:border-gray-700">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="font-semibold text-purple-700 dark:text-purple-400">{data.campaign.name}</p>
				<h1 class="mt-1 text-4xl font-bold">Campaign Wiki</h1>
			</div>

			{#if data.canEdit}
				<a
					href={resolve('/campaigns/[slug]/wiki/new', { slug: data.campaign.slug })}
					class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
				>
					Add wiki entry
				</a>
			{:else if data.hasEditorAccessConfigured}
				<form
					method="GET"
					action={resolve('/campaigns/[slug]/unlock', { slug: data.campaign.slug })}
				>
					<input type="hidden" name="editor" value="1" />
					<button
						type="submit"
						class="rounded border border-purple-700 px-4 py-2 font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-gray-800"
					>
						Editor sign in
					</button>
				</form>
			{/if}
		</div>
	</header>

	<nav
		class="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700"
		aria-label="Campaign"
	>
		<a
			href={resolve('/campaigns/[slug]/wiki', { slug: data.campaign.slug })}
			aria-current="page"
			class="border-b-2 border-purple-700 px-4 py-3 font-medium text-purple-700 dark:border-purple-400 dark:text-purple-400"
		>
			Wiki
		</a>
		<a
			href={resolve('/campaigns/[slug]', { slug: data.campaign.slug })}
			class="border-b-2 border-transparent px-4 py-3 font-medium whitespace-nowrap text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
		>
			Sessions
		</a>
		<a
			href={resolve('/campaigns/[slug]/map', { slug: data.campaign.slug })}
			class="border-b-2 border-transparent px-4 py-3 font-medium whitespace-nowrap text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
		>
			Map
		</a>
	</nav>

	<section class="space-y-5">
		<label class="block">
			<span class="mb-2 block font-medium">Search the Wiki</span>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search names, summaries and entry content..."
				class="w-full rounded border border-gray-300 bg-white p-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
			/>
		</label>

		<div class="flex flex-wrap gap-2" role="group" aria-label="Filter Wiki entries by type">
			{#each filters as filter (filter.value)}
				<button
					type="button"
					onclick={() => (selectedFilter = filter.value)}
					aria-pressed={selectedFilter === filter.value}
					class="rounded-full border px-3 py-1.5 text-sm font-medium"
					class:border-purple-700={selectedFilter === filter.value}
					class:bg-purple-700={selectedFilter === filter.value}
					class:text-white={selectedFilter === filter.value}
					class:border-gray-300={selectedFilter !== filter.value}
					class:hover:bg-gray-50={selectedFilter !== filter.value}
					class:dark:border-gray-700={selectedFilter !== filter.value}
					class:dark:hover:bg-gray-800={selectedFilter !== filter.value}
				>
					{filter.label}
				</button>
			{/each}
		</div>

		<p class="text-sm text-gray-600 dark:text-gray-300">
			Showing {filteredEntities.length} of {data.entities.length} entries
		</p>

		{#if data.entities.length === 0}
			<p class="text-gray-600 dark:text-gray-300">No wiki entries have been added yet.</p>
		{:else if filteredEntities.length === 0}
			<p
				class="rounded border border-gray-200 p-5 text-gray-600 dark:border-gray-700 dark:text-gray-300"
			>
				No entries match this search and category.
			</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each filteredEntities as entity (entity.id)}
					<a
						href={resolve('/campaigns/[slug]/wiki/[entitySlug]', {
							slug: data.campaign.slug,
							entitySlug: entity.slug
						})}
						class="block rounded-lg border border-gray-200 p-5 hover:border-purple-400 hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-purple-500 dark:hover:bg-gray-800"
					>
						<span
							class="text-xs font-semibold tracking-wide text-purple-700 uppercase dark:text-purple-400"
						>
							{getEntityTypeLabel(entity.type)}
						</span>

						<h2 class="mt-2 text-xl font-semibold">{entity.name}</h2>

						{#if entity.summary}
							<p class="mt-2 text-gray-600 dark:text-gray-300">{entity.summary}</p>
						{:else}
							<p class="mt-2 text-gray-500 italic dark:text-gray-400">No summary added.</p>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	</section>
</main>
