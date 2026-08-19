<script lang="ts">
	import { resolve } from '$app/paths';
	import { getEntityTypeLabel } from '$lib/entity-types';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.entity.name} | {data.campaign.name}</title>
	<meta name="description" content={data.entity.summary} />
</svelte:head>

<main class="mx-auto max-w-3xl space-y-8 p-6">
	<nav class="flex flex-wrap items-center justify-between gap-4">
		<a
			href={resolve('/campaigns/[slug]/wiki', {
				slug: data.campaign.slug
			})}
			class="text-purple-700 hover:underline dark:text-purple-400"
		>
			← Back to Campaign Wiki
		</a>

		{#if data.isOwner}
			<div class="flex flex-wrap gap-3">
				<a
					href={resolve('/campaigns/[slug]/wiki/[entitySlug]/edit', {
						slug: data.campaign.slug,
						entitySlug: data.entity.slug
					})}
					class="rounded border border-purple-700 px-4 py-2 font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-gray-800"
				>
					Edit entry
				</a>

				<form
					method="POST"
					action="?/delete"
					onsubmit={(event) => {
						if (!globalThis.confirm(`Delete “${data.entity.name}”? This cannot be undone.`)) {
							event.preventDefault();
						}
					}}
				>
					<button
						type="submit"
						class="rounded border border-red-700 px-4 py-2 font-medium text-red-700 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950"
					>
						Delete entry
					</button>
				</form>
			</div>
		{/if}
	</nav>

	{#if form?.message}
		<p class="rounded bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
			{form.message}
		</p>
	{/if}

	<article>
		<header class="border-b border-gray-200 pb-6 dark:border-gray-700">
			<div class="flex flex-wrap items-center gap-3">
				<span
					class="text-sm font-semibold tracking-wide text-purple-700 uppercase dark:text-purple-400"
				>
					{getEntityTypeLabel(data.entity.type)}
				</span>
			</div>

			<h1 class="mt-3 text-4xl font-bold">
				{data.entity.name}
			</h1>

			{#if data.entity.summary}
				<p class="mt-3 text-lg text-gray-600 dark:text-gray-300">
					{data.entity.summary}
				</p>
			{/if}
		</header>

		<section class="mt-8">
			{#if data.entity.content}
				<p class="whitespace-pre-wrap text-gray-700 dark:text-gray-200">
					{data.entity.content}
				</p>
			{:else}
				<p class="text-gray-500 italic dark:text-gray-400">
					No additional information has been added.
				</p>
			{/if}
		</section>
	</article>
</main>
