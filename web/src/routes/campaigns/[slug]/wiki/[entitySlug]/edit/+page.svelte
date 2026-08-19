<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { getEntityTypeLabel } from '$lib/entity-types';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Edit {data.entity.name} | Campaign Codex</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-6 p-6">
	<a
		href={resolve('/campaigns/[slug]/wiki/[entitySlug]', {
			slug: data.campaign.slug,
			entitySlug: data.entity.slug
		})}
		class="text-purple-700 hover:underline dark:text-purple-400"
	>
		← Cancel editing
	</a>

	<header>
		<p class="font-semibold text-purple-700 dark:text-purple-400">
			{data.campaign.name}
		</p>

		<h1 class="mt-2 text-3xl font-bold">
			Edit {data.entity.name}
		</h1>
	</header>

	{#if form?.message}
		<p class="rounded bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
			{form.message}
		</p>
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<label class="block">
			<span class="mb-1 block font-medium">Entry type</span>

			<select
				name="type"
				value={form?.values.type ?? data.entity.type}
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
			>
				<option value="character">{getEntityTypeLabel('character')}</option>
				<option value="npc">{getEntityTypeLabel('npc')}</option>
				<option value="location">{getEntityTypeLabel('location')}</option>
				<option value="faction">{getEntityTypeLabel('faction')}</option>
				<option value="item">{getEntityTypeLabel('item')}</option>
				<option value="quest">{getEntityTypeLabel('quest')}</option>
				<option value="other">{getEntityTypeLabel('other')}</option>
			</select>
		</label>

		<label class="block">
			<span class="mb-1 block font-medium">Name</span>

			<input
				type="text"
				name="name"
				required
				value={form?.values.name ?? data.entity.name}
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
			/>
		</label>

		<label class="block">
			<span class="mb-1 block font-medium">Short summary</span>

			<input
				type="text"
				name="summary"
				value={form?.values.summary ?? data.entity.summary}
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
			/>
		</label>

		<label class="block">
			<span class="mb-1 block font-medium">Full entry</span>

			<textarea
				name="content"
				rows="12"
				value={form?.values.content ?? data.entity.content}
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
			></textarea>
		</label>

		<button
			type="submit"
			class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
		>
			Save changes
		</button>
	</form>
</main>
