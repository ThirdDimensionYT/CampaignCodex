<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import WikiSuggestionReviewCard from '$lib/components/WikiSuggestionReviewCard.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let generating = $state(false);

	const suggestions = $derived(data.latestImport?.proposedChanges?.suggestions ?? []);
</script>

<svelte:head>
	<title>Wiki updates from Session {data.session.sessionNumber} | Campaign Codex</title>
	<meta name="description" content="Review proposed campaign wiki updates" />
</svelte:head>

<main class="mx-auto max-w-4xl space-y-8 p-6">
	<a
		href={resolve('/campaigns/[slug]', { slug: data.campaign.slug })}
		class="text-purple-700 hover:underline dark:text-purple-400"
	>
		← Back to sessions
	</a>

	<header class="border-b border-gray-200 pb-6 dark:border-gray-700">
		<p class="font-medium text-purple-700 dark:text-purple-400">{data.campaign.name}</p>
		<h1 class="mt-2 text-3xl font-bold">
			Session {data.session.sessionNumber}: Generate wiki updates
		</h1>
		<p class="mt-3 text-gray-600 dark:text-gray-300">
			AI suggestions are drafts. Nothing changes in the wiki until you review and approve it.
		</p>
	</header>

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

	{#if !data.session.rawNotes.trim()}
		<section class="rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-900">
			<p>Add notes to this session before asking the app to generate wiki updates.</p>
			<a
				href={resolve('/campaigns/[slug]/sessions/[sessionNumber]/edit', {
					slug: data.campaign.slug,
					sessionNumber: String(data.session.sessionNumber)
				})}
				class="mt-3 inline-block font-medium underline"
			>
				Edit session notes
			</a>
		</section>
	{:else if !data.latestImport || data.latestImport.status !== 'pending'}
		<section class="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
			{#if data.latestImport?.status === 'failed'}
				<h2 class="text-xl font-semibold">The previous analysis did not finish</h2>
				<p class="mt-2 text-gray-600 dark:text-gray-300">
					{data.latestImport.errorMessage ?? 'Cloudflare AI could not process the notes.'}
				</p>
			{:else if data.latestImport?.status === 'approved'}
				<h2 class="text-xl font-semibold">Suggestions applied</h2>
				<p class="mt-2 text-gray-600 dark:text-gray-300">
					The most recent suggestions have already been added to the wiki.
				</p>
			{:else if data.latestImport?.status === 'rejected'}
				<h2 class="text-xl font-semibold">Suggestions discarded</h2>
				<p class="mt-2 text-gray-600 dark:text-gray-300">
					You can run the analysis again to create a fresh set.
				</p>
			{:else}
				<h2 class="text-xl font-semibold">Ready to analyse this session</h2>
				<p class="mt-2 text-gray-600 dark:text-gray-300">
					The analysis may take several seconds and uses your Cloudflare Workers AI allowance.
				</p>
			{/if}

			<form
				method="POST"
				action="?/generate"
				use:enhance={() => {
					generating = true;

					return async ({ update }) => {
						await update();
						generating = false;
					};
				}}
				class="mt-5"
			>
				<button
					type="submit"
					disabled={generating}
					class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800 disabled:cursor-wait disabled:opacity-60"
				>
					{generating ? 'Analysing session notes…' : 'Generate wiki updates'}
				</button>
			</form>
		</section>
	{:else if suggestions.length === 0}
		<section class="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
			<h2 class="text-xl font-semibold">No clear wiki updates found</h2>
			<p class="mt-2 text-gray-600 dark:text-gray-300">
				The analysis did not find any facts strong enough to suggest as wiki changes.
			</p>
			<form method="POST" action="?/discard" class="mt-5">
				<input type="hidden" name="importId" value={data.latestImport.id} />
				<button
					type="submit"
					class="rounded border border-gray-400 px-4 py-2 font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
				>
					Finish review
				</button>
			</form>
		</section>
	{:else}
		<form method="POST" action="?/apply" class="space-y-6">
			<input type="hidden" name="importId" value={data.latestImport.id} />

			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 class="text-2xl font-semibold">
						Review {suggestions.length} proposed update{suggestions.length === 1 ? '' : 's'}
					</h2>
					<p class="mt-1 text-gray-600 dark:text-gray-300">
						Untick anything you do not want to publish. You can choose what kind of entry it is,
						create a new entry, or add the information to an existing one.
					</p>
				</div>
			</div>

			{#each suggestions as suggestion, index (index)}
				<WikiSuggestionReviewCard {suggestion} {index} existingEntries={data.existingEntries} />
			{/each}

			<div class="flex flex-wrap gap-3">
				<button
					type="submit"
					class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
				>
					Add selected updates to wiki
				</button>
			</div>
		</form>

		<form method="POST" action="?/discard">
			<input type="hidden" name="importId" value={data.latestImport.id} />
			<button
				type="submit"
				onclick={(event) => {
					if (!globalThis.confirm('Discard all of these suggestions?')) {
						event.preventDefault();
					}
				}}
				class="font-medium text-red-700 hover:underline dark:text-red-400"
			>
				Discard all suggestions
			</button>
		</form>
	{/if}
</main>
