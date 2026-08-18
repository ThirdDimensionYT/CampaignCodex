<script lang="ts">
	import { enhance } from '$app/forms';
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
	<a href="/" class="text-purple-700 hover:underline">
		← All campaigns
	</a>

	<header class="border-b border-gray-200 pb-6">
		<h1 class="text-4xl font-bold">{data.campaign.name}</h1>

		{#if data.campaign.description}
			<p class="mt-3 text-lg text-gray-600">
				{data.campaign.description}
			</p>
		{/if}
	</header>

	<section class="rounded-lg border border-gray-200 p-6">
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

		<form
			method="POST"
			action="?/createSession"
			use:enhance
			class="space-y-4"
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block">
					<span class="mb-1 block font-medium">Session number</span>
					<input
						type="number"
						name="sessionNumber"
						min="1"
						required
						value={form?.values.sessionNumber ?? ''}
						class="w-full rounded border border-gray-300 p-2"
						placeholder="1"
					/>
				</label>

				<label class="block">
					<span class="mb-1 block font-medium">Session date</span>
					<input
						type="date"
						name="sessionDate"
						value={form?.values.sessionDate ?? ''}
						class="w-full rounded border border-gray-300 p-2"
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
					class="w-full rounded border border-gray-300 p-2"
					placeholder="Arrival at the ruined keep"
				/>
			</label>

			<label class="block">
				<span class="mb-1 block font-medium">Notes</span>
				<textarea
					name="rawNotes"
					rows="10"
					value={form?.values.rawNotes ?? ''}
					class="w-full rounded border border-gray-300 p-2"
					placeholder="Write or paste your session notes here..."
				></textarea>
			</label>

			<button
				type="submit"
				class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
			>
				Save session
			</button>
		</form>
	</section>

	<section>
		<h2 class="mb-4 text-2xl font-semibold">Session history</h2>

		{#if data.sessions.length === 0}
			<p class="text-gray-600">
				No session notes have been added yet.
			</p>
		{:else}
			<div class="space-y-4">
				{#each data.sessions as session}
					<article class="rounded-lg border border-gray-200 p-5">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<h3 class="text-xl font-semibold">
								Session {session.sessionNumber}: {session.title}
							</h3>

							<span class="text-sm text-gray-500">
								{formatDate(session.sessionDate)}
							</span>
						</div>

						{#if session.rawNotes}
							<p class="mt-4 whitespace-pre-wrap text-gray-700">
								{session.rawNotes}
							</p>
						{:else}
							<p class="mt-4 italic text-gray-500">
								No notes were added.
							</p>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<section>
		<h2 class="mb-4 text-2xl font-semibold">Campaign Wiki</h2>

		<div class="grid gap-4 sm:grid-cols-2">
			<article class="rounded-lg border border-gray-200 p-5">
				<h3 class="text-xl font-semibold">Characters</h3>
				<p class="mt-2 text-gray-600">
					Player characters and NPCs will appear here.
				</p>
			</article>

			<article class="rounded-lg border border-gray-200 p-5">
				<h3 class="text-xl font-semibold">Locations</h3>
				<p class="mt-2 text-gray-600">
					Cities, regions and landmarks will appear here.
				</p>
			</article>

			<article class="rounded-lg border border-gray-200 p-5">
				<h3 class="text-xl font-semibold">Quests</h3>
				<p class="mt-2 text-gray-600">
					Ongoing and completed quests will appear here.
				</p>
			</article>

			<article class="rounded-lg border border-gray-200 p-5">
				<h3 class="text-xl font-semibold">Factions</h3>
				<p class="mt-2 text-gray-600">
					Important organisations will appear here.
				</p>
			</article>
		</div>
	</section>
</main>