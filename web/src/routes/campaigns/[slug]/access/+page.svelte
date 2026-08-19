<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let showPassphrase = $state(false);
</script>

<svelte:head>
	<title>Player access | {data.campaign.name}</title>
	<meta name="description" content={`Manage player access to ${data.campaign.name}`} />
</svelte:head>

<main class="mx-auto max-w-xl space-y-6 p-6 pt-20">
	<a
		href={resolve('/campaigns/[slug]', {
			slug: data.campaign.slug
		})}
		class="text-purple-700 hover:underline dark:text-purple-400"
	>
		← Back to {data.campaign.name}
	</a>

	<header>
		<h1 class="text-3xl font-bold">Player access</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-300">
			Set the passphrase players will use to unlock this campaign.
		</p>
	</header>

	<div
		class="rounded border p-4"
		class:border-green-300={data.hasPassphrase}
		class:bg-green-50={data.hasPassphrase}
		class:border-amber-300={!data.hasPassphrase}
		class:bg-amber-50={!data.hasPassphrase}
		class:dark:border-green-800={data.hasPassphrase}
		class:dark:bg-green-950={data.hasPassphrase}
		class:dark:border-amber-800={!data.hasPassphrase}
		class:dark:bg-amber-950={!data.hasPassphrase}
	>
		{#if data.hasPassphrase}
			A player passphrase is currently configured.
		{:else}
			This campaign does not have a player passphrase yet.
		{/if}
	</div>

	{#if form?.message}
		<p
			aria-live="polite"
			class="rounded p-3"
			class:bg-green-100={form.success}
			class:text-green-800={form.success}
			class:bg-red-100={!form.success}
			class:text-red-800={!form.success}
			class:dark:bg-green-950={form.success}
			class:dark:text-green-200={form.success}
			class:dark:bg-red-950={!form.success}
			class:dark:text-red-200={!form.success}
		>
			{form.message}
		</p>
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<label class="block">
			<span class="mb-1 block font-medium">
				{data.hasPassphrase ? 'New player passphrase' : 'Player passphrase'}
			</span>

			<input
				type={showPassphrase ? 'text' : 'password'}
				name="passphrase"
				required
				minlength="8"
				maxlength="128"
				autocomplete="new-password"
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

		<p class="text-sm text-gray-600 dark:text-gray-300">
			Use at least 8 characters. Changing this will revoke existing player access.
		</p>

		<button
			type="submit"
			class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
		>
			{data.hasPassphrase ? 'Change passphrase' : 'Set passphrase'}
		</button>
	</form>
</main>
