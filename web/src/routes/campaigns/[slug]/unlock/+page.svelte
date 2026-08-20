<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let showPassphrase = $state(false);
	let showEditorPassword = $state(false);
</script>

<svelte:head>
	<title>Unlock {data.campaign.name} | Campaign Codex</title>
	<meta name="description" content={`Enter the player passphrase for ${data.campaign.name}`} />
</svelte:head>

<main class="mx-auto max-w-md space-y-6 p-6 pt-20">
	<header>
		<h1 class="text-3xl font-bold">{data.campaign.name}</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-300">
			Use the player passphrase to read the campaign, or an editor password to make changes.
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

	{#if data.hasPassphrase}
		<form method="POST" use:enhance class="space-y-5">
			<h2 class="text-xl font-semibold">Player access</h2>

			<label class="block">
				<span class="mb-1 block font-medium">Campaign passphrase</span>

				<input
					type={showPassphrase ? 'text' : 'password'}
					name="passphrase"
					required
					maxlength="128"
					autocomplete="current-password"
					class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
			</label>

			<label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
				<input
					type="checkbox"
					bind:checked={showPassphrase}
					class="rounded border-gray-300 text-purple-700 focus:ring-purple-600 dark:border-gray-700 dark:bg-gray-900"
				/>
				Show passphrase
			</label>

			<button
				type="submit"
				class="w-full rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
			>
				Unlock campaign
			</button>
		</form>
	{/if}

	{#if data.hasEditorAccess}
		<form
			method="POST"
			action="?/editor"
			use:enhance
			class="space-y-5 border-t border-gray-200 pt-6 dark:border-gray-700"
		>
			<h2 class="text-xl font-semibold">Editor access</h2>

			<label class="block">
				<span class="mb-1 block font-medium">Editor password</span>

				<input
					type={showEditorPassword ? 'text' : 'password'}
					name="editorPassphrase"
					required
					maxlength="128"
					autocomplete="current-password"
					class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
			</label>

			<label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
				<input
					type="checkbox"
					bind:checked={showEditorPassword}
					class="rounded border-gray-300 text-purple-700 focus:ring-purple-600 dark:border-gray-700 dark:bg-gray-900"
				/>
				Show editor password
			</label>

			<button
				type="submit"
				class="w-full rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
			>
				Unlock editor access
			</button>
		</form>
	{/if}

	{#if !data.hasPassphrase && !data.hasEditorAccess}
		<p class="rounded bg-amber-100 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
			Access has not been configured for this campaign. Please contact the campaign organiser.
		</p>
	{/if}

	<a href={resolve('/')} class="inline-block text-purple-700 hover:underline dark:text-purple-400">
		← Back to Campaign Codex
	</a>
</main>
