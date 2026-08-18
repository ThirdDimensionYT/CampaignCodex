<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Campaign Codex</title>
	<meta name="description" content="Session notes and wiki pages for tabletop campaigns" />
</svelte:head>

<main class="mx-auto max-w-4xl space-y-8 p-6">
	<header>
		<h1 class="text-4xl font-bold">Campaign Codex</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-300">
			Keep your campaign notes, characters and locations organised.
		</p>
	</header>

	<section class="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
		<h2 class="mb-4 text-2xl font-semibold">Create a campaign</h2>

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

		<form method="POST" action="?/create" use:enhance class="space-y-4">
			<label class="block">
				<span class="mb-1 block font-medium">Campaign name</span>
				<input
					type="text"
					name="name"
					required
					value={form?.values.name ?? ''}
					class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
					placeholder="Name your campaign..."
				/>
			</label>

			<label class="block">
				<span class="mb-1 block font-medium">Description</span>
				<textarea
					name="description"
					rows="4"
					value={form?.values.description ?? ''}
					class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
					placeholder="A short description of the campaign..."></textarea>
			</label>

			<button
				type="submit"
				class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
			>
				Create campaign
			</button>
		</form>
	</section>

	<section>
		<h2 class="mb-4 text-2xl font-semibold">Your campaigns</h2>

		{#if data.campaigns.length === 0}
			<p class="text-gray-600 dark:text-gray-300">You haven't created a campaign yet.</p>
		{:else}
			<ul class="space-y-3">
				{#each data.campaigns as campaign}
					<li>
						<a
							href={`/campaigns/${campaign.slug}`}
							class="block rounded-lg border border-gray-200 p-4 hover:border-purple-400 hover:bg-purple-50 dark:border-gray-700 dark:hover:border-purple-500 dark:hover:bg-gray-900"
						>
							<h3 class="text-xl font-semibold">{campaign.name}</h3>

							{#if campaign.description}
								<p class="mt-1 text-gray-600 dark:text-gray-300">{campaign.description}</p>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
