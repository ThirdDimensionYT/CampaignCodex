<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Edit {data.campaign.name} | Campaign Codex</title>
	<meta name="description" content={`Edit the details for ${data.campaign.name}`} />
</svelte:head>

<main class="mx-auto max-w-2xl space-y-6 p-6">
	<a
		href={resolve('/campaigns/[slug]', { slug: data.campaign.slug })}
		class="text-purple-700 hover:underline dark:text-purple-400"
	>
		← Back to {data.campaign.name}
	</a>

	<header>
		<h1 class="text-3xl font-bold">Edit campaign</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-300">
			Change the campaign name or description. Its existing web address will stay the same.
		</p>
	</header>

	{#if form?.message}
		<p class="rounded bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
			{form.message}
		</p>
	{/if}

	<form method="POST" use:enhance class="space-y-4">
		<label class="block">
			<span class="mb-1 block font-medium">Campaign name</span>
			<input
				type="text"
				name="name"
				required
				value={form?.values.name ?? data.campaign.name}
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
			/>
		</label>

		<label class="block">
			<span class="mb-1 block font-medium">Description</span>
			<textarea
				name="description"
				rows="5"
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				>{form?.values.description ?? data.campaign.description}</textarea
			>
		</label>

		<div class="flex flex-wrap gap-3">
			<button
				type="submit"
				class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
			>
				Save changes
			</button>

			<a
				href={resolve('/campaigns/[slug]', { slug: data.campaign.slug })}
				class="rounded border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
			>
				Cancel
			</a>
		</div>
	</form>
</main>
