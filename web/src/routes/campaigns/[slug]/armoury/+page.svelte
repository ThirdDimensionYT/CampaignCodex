<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type ArmouryView = 'items' | 'characters' | 'npcs';
	let selectedView = $state<ArmouryView>('items');

	const tabs: Array<{ value: ArmouryView; label: string }> = [
		{ value: 'items', label: 'Armoury' },
		{ value: 'characters', label: 'Player Characters' },
		{ value: 'npcs', label: 'NPCs' }
	];
</script>

<svelte:head>
	<title>{data.campaign.name} | Armoury</title>
	<meta name="description" content={data.campaign.description} />
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 p-6">
	<a href={resolve('/')} class="text-purple-700 hover:underline dark:text-purple-400">
		← All campaigns and armouries
	</a>

	<header class="border-b border-gray-200 pb-6 dark:border-gray-700">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="font-semibold text-purple-700 dark:text-purple-400">Armoury</p>
				<h1 class="mt-1 text-4xl font-bold">{data.campaign.name}</h1>
				{#if data.campaign.description}
					<p class="mt-3 text-lg text-gray-600 dark:text-gray-300">{data.campaign.description}</p>
				{/if}
			</div>

			{#if data.isOwner}
				<div class="flex flex-wrap gap-3">
					<a
						href={resolve('/campaigns/[slug]/edit', { slug: data.campaign.slug })}
						class="rounded border border-purple-700 px-4 py-2 font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-gray-800"
					>
						Edit armoury
					</a>
					<a
						href={resolve('/campaigns/[slug]/access', { slug: data.campaign.slug })}
						class="rounded border border-purple-700 px-4 py-2 font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-gray-800"
					>
						Access settings
					</a>
				</div>
			{:else if data.hasEditorAccessConfigured && !data.canEdit}
				<form
					method="GET"
					action={resolve('/campaigns/[slug]/unlock', { slug: data.campaign.slug })}
				>
					<input type="hidden" name="editor" value="1" />
					<button
						type="submit"
						class="rounded border border-purple-700 px-4 py-2 font-medium text-purple-700 dark:border-purple-400 dark:text-purple-400"
					>
						Editor sign in
					</button>
				</form>
			{/if}
		</div>
	</header>

	<nav
		class="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700"
		aria-label="Armoury sections"
	>
		{#each tabs as tab (tab.value)}
			<button
				type="button"
				onclick={() => (selectedView = tab.value)}
				aria-current={selectedView === tab.value ? 'page' : undefined}
				class="border-b-2 px-4 py-3 font-medium whitespace-nowrap"
				class:border-purple-700={selectedView === tab.value}
				class:text-purple-700={selectedView === tab.value}
				class:dark:border-purple-400={selectedView === tab.value}
				class:dark:text-purple-400={selectedView === tab.value}
				class:border-transparent={selectedView !== tab.value}
				class:text-gray-600={selectedView !== tab.value}
				class:dark:text-gray-300={selectedView !== tab.value}
			>
				{tab.label}
			</button>
		{/each}
	</nav>

	{#if form?.message}
		<p
			class="rounded p-4"
			class:bg-green-100={form.success}
			class:text-green-800={form.success}
			class:bg-red-100={!form.success}
			class:text-red-800={!form.success}
		>
			{form.message}
		</p>
	{/if}

	{#if selectedView === 'items'}
		<section class="space-y-5">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-2xl font-semibold">Armoury items</h2>
					<p class="mt-1 text-gray-600 dark:text-gray-300">
						Available items can be checked out to an entered Player Character.
					</p>
				</div>
				{#if data.canEdit}
					<a
						href={resolve(`/campaigns/${data.campaign.slug}/wiki/new?type=item`)}
						class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
						>Add item</a
					>
				{/if}
			</div>

			{#if data.items.length === 0}
				<p class="text-gray-600 dark:text-gray-300">No items have been added to this armoury.</p>
			{:else}
				<div class="grid gap-4 md:grid-cols-2">
					{#each data.items as item (item.id)}
						<article
							class="rounded-lg border border-gray-200 p-5 dark:border-gray-700 dark:bg-gray-900"
						>
							<a
								href={resolve('/campaigns/[slug]/wiki/[entitySlug]', {
									slug: data.campaign.slug,
									entitySlug: item.slug
								})}
								class="text-xl font-semibold hover:text-purple-700 dark:hover:text-purple-400"
							>
								{item.name}
							</a>
							{#if item.summary}<p class="mt-2 text-gray-600 dark:text-gray-300">
									{item.summary}
								</p>{/if}

							{#if item.checkout}
								<p
									class="mt-4 rounded bg-amber-100 p-3 font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200"
								>
									Checked out by {item.checkout.characterName}
								</p>
								<form method="POST" action="?/returnItem" use:enhance class="mt-3">
									<input type="hidden" name="itemId" value={item.id} />
									<button
										type="submit"
										class="rounded border border-purple-700 px-3 py-2 font-medium text-purple-700 dark:border-purple-400 dark:text-purple-400"
										>Mark as returned</button
									>
								</form>
							{:else}
								<p
									class="mt-4 rounded bg-green-100 p-3 font-medium text-green-800 dark:bg-green-950 dark:text-green-200"
								>
									Available
								</p>
								{#if data.characters.length === 0}
									<p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
										Add a Player Character before checking out items.
									</p>
								{:else}
									<form method="POST" action="?/checkout" use:enhance class="mt-3 space-y-3">
										<input type="hidden" name="itemId" value={item.id} />
										<label class="block">
											<span class="mb-1 block text-sm font-medium">Check out to</span>
											<select
												name="characterId"
												required
												class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
											>
												<option value="">Choose a Player Character</option>
												{#each data.characters as character (character.id)}<option
														value={character.id}>{character.name}</option
													>{/each}
											</select>
										</label>
										<button
											type="submit"
											class="rounded bg-purple-700 px-3 py-2 font-medium text-white hover:bg-purple-800"
											>Check out item</button
										>
									</form>
								{/if}
							{/if}
						</article>
					{/each}
				</div>
			{/if}
		</section>
	{:else}
		{@const entries = selectedView === 'characters' ? data.characters : data.npcs}
		{@const entryType = selectedView === 'characters' ? 'character' : 'npc'}
		<section class="space-y-5">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="text-2xl font-semibold">
					{selectedView === 'characters' ? 'Player Characters' : 'NPCs'}
				</h2>
				{#if data.canEdit}
					<a
						href={resolve(`/campaigns/${data.campaign.slug}/wiki/new?type=${entryType}`)}
						class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
						>Add {selectedView === 'characters' ? 'Player Character' : 'NPC'}</a
					>
				{/if}
			</div>
			{#if entries.length === 0}
				<p class="text-gray-600 dark:text-gray-300">No entries have been added here yet.</p>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2">
					{#each entries as entry (entry.id)}
						<a
							href={resolve('/campaigns/[slug]/wiki/[entitySlug]', {
								slug: data.campaign.slug,
								entitySlug: entry.slug
							})}
							class="block rounded-lg border border-gray-200 p-5 hover:border-purple-400 hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-purple-500 dark:hover:bg-gray-800"
						>
							<h3 class="text-xl font-semibold">{entry.name}</h3>
							{#if entry.summary}<p class="mt-2 text-gray-600 dark:text-gray-300">
									{entry.summary}
								</p>{/if}
						</a>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</main>
