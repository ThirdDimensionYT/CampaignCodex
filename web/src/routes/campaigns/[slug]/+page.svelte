<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { getEntityTypeLabel } from '$lib/entity-types';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function formatDate(date: Date | null): string {
		if (!date) {
			return 'Date not set';
		}

		return new Intl.DateTimeFormat('en-GB', {
			dateStyle: 'medium',
			timeZone: 'UTC'
		}).format(date);
	}
</script>

<svelte:head>
	<title>{data.campaign.name} | Campaign Codex</title>
	<meta name="description" content={data.campaign.description} />
</svelte:head>

<main class="mx-auto max-w-4xl space-y-8 p-6">
	<a href={resolve('/')} class="text-purple-700 hover:underline dark:text-purple-400">
		← All campaigns
	</a>

	<header class="border-b border-gray-200 pb-6 dark:border-gray-700">
		<h1 class="text-4xl font-bold">{data.campaign.name}</h1>

		{#if data.campaign.description}
			<p class="mt-3 text-lg text-gray-600 dark:text-gray-300">
				{data.campaign.description}
			</p>
		{/if}

		{#if data.isOwner}
			<a
				href={resolve('/campaigns/[slug]/access', {
					slug: data.campaign.slug
				})}
				class="mt-4 inline-block rounded border border-purple-700 px-4 py-2 font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-gray-800"
			>
				Player access
			</a>
		{/if}
	</header>

	{#if data.isOwner}
		<section class="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
			<h2 class="mb-4 text-2xl font-semibold">Add session notes</h2>

			{#if form?.message}
				<p
					class="mb-4 rounded p-3"
					class:bg-green-100={form.success}
					class:text-green-800={form.success}
					class:bg-red-100={!form.success}
					class:text-red-800={!form.success}
				>
					{form.message}
				</p>
			{/if}

			<form method="POST" action="?/createSession" use:enhance class="space-y-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="block">
						<span class="mb-1 block font-medium">Session number</span>
						<input
							type="number"
							name="sessionNumber"
							min="1"
							required
							value={form?.values.sessionNumber ?? ''}
							class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
							placeholder="1"
						/>
					</label>

					<label class="block">
						<span class="mb-1 block font-medium">Session date</span>
						<input
							type="date"
							name="sessionDate"
							value={form?.values.sessionDate ?? ''}
							class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
						/>
					</label>
				</div>

				<label class="block">
					<span class="mb-1 block font-medium">Session title</span>
					<input
						type="text"
						name="title"
						required
						value={form?.values.title ?? ''}
						class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
						placeholder="Arrival at the ruined keep"
					/>
				</label>

				<label class="block">
					<span class="mb-1 block font-medium">Notes</span>
					<textarea
						name="rawNotes"
						rows="10"
						value={form?.values.rawNotes ?? ''}
						class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
						placeholder="Write or paste your session notes here..."></textarea>
				</label>

				<button
					type="submit"
					class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
				>
					Save session
				</button>
			</form>
		</section>
	{/if}

	<section>
		<h2 class="mb-4 text-2xl font-semibold">Session history</h2>

		{#if data.sessions.length === 0}
			<p class="text-gray-600 dark:text-gray-300">No session notes have been added yet.</p>
		{:else}
			<div class="space-y-4">
				{#each data.sessions as session (session.id)}
					<article
						class="rounded-lg border border-gray-200 p-5 dark:border-gray-700 dark:bg-gray-900"
					>
						<div class="flex flex-wrap items-start justify-between gap-2">
							<h3 class="text-xl font-semibold">
								Session {session.sessionNumber}: {session.title}
							</h3>

							<span class="text-sm text-gray-500 dark:text-gray-400">
								{formatDate(session.sessionDate)}
							</span>
						</div>

						{#if session.rawNotes}
							<p class="mt-4 whitespace-pre-wrap text-gray-700 dark:text-gray-200">
								{session.rawNotes}
							</p>
						{:else}
							<p class="mt-4 text-gray-500 italic dark:text-gray-400">No notes were added.</p>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<section>
		<div class="mb-4 flex items-center justify-between gap-4">
			<h2 class="text-2xl font-semibold">Campaign Wiki</h2>

			{#if data.isOwner}
				<a
					href={resolve('/campaigns/[slug]/wiki/new', {
						slug: data.campaign.slug
					})}
					class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
				>
					Add wiki entry
				</a>
			{/if}
		</div>

		{#if data.entities.length === 0}
			<p class="text-gray-600 dark:text-gray-300">No wiki entries have been added yet.</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each data.entities as entity (entity.id)}
					<a
						href={resolve('/campaigns/[slug]/wiki/[entitySlug]', {
							slug: data.campaign.slug,
							entitySlug: entity.slug
						})}
						class="block rounded-lg border border-gray-200 p-5 hover:border-purple-400 hover:bg-purple-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-purple-500 dark:hover:bg-gray-800"
					>
						<div class="flex items-start justify-between gap-3">
							<span
								class="text-xs font-semibold tracking-wide text-purple-700 uppercase dark:text-purple-400"
							>
								{getEntityTypeLabel(entity.type)}
							</span>
						</div>

						<h3 class="mt-2 text-xl font-semibold">
							{entity.name}
						</h3>

						{#if entity.summary}
							<p class="mt-2 text-gray-600 dark:text-gray-300">
								{entity.summary}
							</p>
						{:else}
							<p class="mt-2 text-gray-500 italic dark:text-gray-400">No summary added.</p>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	</section>
</main>
