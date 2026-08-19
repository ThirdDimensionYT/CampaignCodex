<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { getEntityTypeLabel } from '$lib/entity-types';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>New wiki entry | {data.campaign.name}</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-6 p-6">
	<a
		href={resolve('/campaigns/[slug]', {
			slug: data.campaign.slug
		})}
		class="text-purple-700 hover:underline dark:text-purple-400"
	>
		← Back to {data.campaign.name}
	</a>

	<header>
		<h1 class="text-3xl font-bold">Add a wiki entry</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-300">
			Create a character, location, faction, item or quest.
		</p>
	</header>

	{#if form?.message}
		<p
			class="rounded p-3"
			class:bg-green-100={form.success}
			class:text-green-800={form.success}
			class:bg-red-100={!form.success}
			class:text-red-800={!form.success}
		>
			{form.message}
		</p>
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<label class="block">
			<span class="mb-1 block font-medium">Entry type</span>

			<select
				name="type"
				value={form?.values.type ?? 'character'}
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
				value={form?.values.name ?? ''}
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				placeholder="Captain Elara Thorn"
			/>
		</label>

		<label class="block">
			<span class="mb-1 block font-medium">Short summary</span>

			<input
				type="text"
				name="summary"
				value={form?.values.summary ?? ''}
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				placeholder="Commander of the city watch"
			/>
		</label>

		<label class="block">
			<span class="mb-1 block font-medium">Full entry</span>

			<textarea
				name="content"
				rows="12"
				value={form?.values.content ?? ''}
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				placeholder="Write everything known about this entry..."></textarea>
		</label>

		<button
			type="submit"
			class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
		>
			Save wiki entry
		</button>
	</form>
</main>
