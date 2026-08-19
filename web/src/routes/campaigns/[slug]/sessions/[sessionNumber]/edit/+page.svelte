<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function dateInputValue(date: Date | null): string {
		return date ? date.toISOString().slice(0, 10) : '';
	}
</script>

<svelte:head>
	<title>Edit Session {data.session.sessionNumber} | {data.campaign.name}</title>
	<meta name="description" content={`Edit session notes for ${data.campaign.name}`} />
</svelte:head>

<main class="mx-auto max-w-3xl space-y-6 p-6">
	<a
		href={resolve('/campaigns/[slug]', { slug: data.campaign.slug })}
		class="text-purple-700 hover:underline dark:text-purple-400"
	>
		← Back to Sessions
	</a>

	<header>
		<p class="font-semibold text-purple-700 dark:text-purple-400">{data.campaign.name}</p>
		<h1 class="mt-2 text-3xl font-bold">Edit session notes</h1>
	</header>

	{#if form?.message}
		<p class="rounded bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
			{form.message}
		</p>
	{/if}

	<form method="POST" use:enhance class="space-y-4">
		<div class="grid gap-4 sm:grid-cols-2">
			<label class="block">
				<span class="mb-1 block font-medium">Session number</span>
				<input
					type="number"
					name="sessionNumber"
					min="1"
					required
					value={form?.values.sessionNumber ?? data.session.sessionNumber}
					class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
			</label>

			<label class="block">
				<span class="mb-1 block font-medium">Session date</span>
				<input
					type="date"
					name="sessionDate"
					value={form?.values.sessionDate ?? dateInputValue(data.session.sessionDate)}
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
				value={form?.values.title ?? data.session.title}
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
			/>
		</label>

		<label class="block">
			<span class="mb-1 block font-medium">Notes</span>
			<textarea
				name="rawNotes"
				rows="14"
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				>{form?.values.rawNotes ?? data.session.rawNotes}</textarea
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
