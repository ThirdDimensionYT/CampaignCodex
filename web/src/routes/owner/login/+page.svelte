<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Owner login | Campaign Codex</title>
	<meta name="description" content="Owner login for Campaign Codex" />
</svelte:head>

<main class="mx-auto max-w-md space-y-6 p-6 pt-20">
	<header>
		<h1 class="text-3xl font-bold">Owner login</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-300">
			Sign in to create and edit campaign content.
		</p>
	</header>

	{#if form?.message}
		<p
			aria-live="polite"
			class="rounded bg-red-100 p-3 text-red-800 dark:bg-red-950 dark:text-red-200"
		>
			{form.message}
		</p>
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<label class="block">
			<span class="mb-1 block font-medium">Owner password</span>

			<input
				type="password"
				name="password"
				required
				autocomplete="current-password"
				class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
			/>
		</label>

		<button
			type="submit"
			class="w-full rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
		>
			Sign in
		</button>
	</form>

	<a href="/" class="inline-block text-purple-700 hover:underline dark:text-purple-400">
		← Back to Campaign Codex
	</a>
</main>
