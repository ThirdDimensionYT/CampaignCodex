<script lang="ts">
	import { getEntityTypeLabel } from '$lib/entity-types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.entity.name} | {data.campaign.name}</title>
	<meta name="description" content={data.entity.summary} />
</svelte:head>

<main class="mx-auto max-w-3xl space-y-8 p-6">
	<a
		href={`/campaigns/${data.campaign.slug}`}
		class="text-purple-700 hover:underline dark:text-purple-400"
	>
		← Back to {data.campaign.name}
	</a>

	<article>
		<header class="border-b border-gray-200 pb-6 dark:border-gray-700">
			<div class="flex flex-wrap items-center gap-3">
				<span
					class="text-sm font-semibold tracking-wide text-purple-700 uppercase dark:text-purple-400"
				>
					{getEntityTypeLabel(data.entity.type)}
				</span>

				{#if data.entity.visibility === 'dm'}
					<span
						class="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200"
					>
						DM only
					</span>
				{/if}
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
