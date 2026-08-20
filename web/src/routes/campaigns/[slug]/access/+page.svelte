<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let showPassphrase = $state(false);
	let showEditorPassphrase = $state(false);
</script>

<svelte:head>
	<title>Access settings | {data.campaign.name}</title>
	<meta name="description" content={`Manage player and editor access to ${data.campaign.name}`} />
</svelte:head>

<main class="mx-auto max-w-2xl space-y-8 p-6 pt-20">
	<a
		href={resolve('/campaigns/[slug]', {
			slug: data.campaign.slug
		})}
		class="text-purple-700 hover:underline dark:text-purple-400"
	>
		← Back to {data.campaign.name}
	</a>

	<header>
		<h1 class="text-3xl font-bold">Access settings</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-300">
			Manage read-only player access and trusted editor access separately.
		</p>
	</header>

	<h2 class="text-2xl font-semibold">Player access</h2>

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

	<section class="space-y-5 border-t border-gray-200 pt-8 dark:border-gray-700">
		<header>
			<h2 class="text-2xl font-semibold">Editor access</h2>
			<p class="mt-2 text-gray-600 dark:text-gray-300">
				Create a separate password for each trusted person. Editors can manage this campaign's
				sessions and wiki, but cannot change campaign or access settings.
			</p>
		</header>

		{#if data.editors.length > 0}
			<div class="space-y-3">
				<h3 class="font-semibold">Current editors</h3>

				{#each data.editors as editor (editor.id)}
					<div
						class="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 p-4 dark:border-gray-700"
					>
						<div>
							<p class="font-medium">{editor.label}</p>
							<p class="text-sm text-gray-500 dark:text-gray-400">
								Access created {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(
									editor.createdAt
								)}
							</p>
						</div>

						<form
							method="POST"
							action="?/revokeEditor"
							onsubmit={(event) => {
								if (!globalThis.confirm(`Revoke editor access for ${editor.label}?`)) {
									event.preventDefault();
								}
							}}
						>
							<input type="hidden" name="editorId" value={editor.id} />
							<button
								type="submit"
								class="font-medium text-red-700 hover:underline dark:text-red-400"
							>
								Revoke
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}

		<form
			method="POST"
			action="?/createEditor"
			use:enhance
			class="space-y-5 rounded border border-gray-200 p-5 dark:border-gray-700"
		>
			<h3 class="text-lg font-semibold">Add an editor</h3>

			<label class="block">
				<span class="mb-1 block font-medium">Editor name</span>
				<input
					type="text"
					name="label"
					required
					minlength="2"
					maxlength="80"
					placeholder="Alex (Game Master)"
					class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
			</label>

			<label class="block">
				<span class="mb-1 block font-medium">Editor password</span>
				<input
					type={showEditorPassphrase ? 'text' : 'password'}
					name="editorPassphrase"
					required
					minlength="12"
					maxlength="128"
					autocomplete="new-password"
					class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
				/>
			</label>

			<label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
				<input
					type="checkbox"
					bind:checked={showEditorPassphrase}
					class="rounded border-gray-300 text-purple-700 focus:ring-purple-600 dark:border-gray-700 dark:bg-gray-900"
				/>
				Show editor password
			</label>

			<p class="text-sm text-gray-600 dark:text-gray-300">
				Use at least 12 characters. Store it safely—the app cannot display it again after saving.
			</p>

			<button
				type="submit"
				class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
			>
				Create editor access
			</button>
		</form>
	</section>
</main>
