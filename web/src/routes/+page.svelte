<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function formatCredentialDate(date: Date): string {
		return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date);
	}
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

	{#if data.isOwner}
		<section class="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
			<h2 class="mb-4 text-2xl font-semibold">Create something new</h2>

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
				<fieldset>
					<legend class="mb-2 font-medium">What would you like to create?</legend>
					<div class="grid gap-3 sm:grid-cols-2">
						<label class="cursor-pointer rounded border border-gray-300 p-4 dark:border-gray-700">
							<input
								type="radio"
								name="kind"
								value="campaign"
								checked={(form?.values?.kind ?? 'campaign') === 'campaign'}
								class="mr-2"
							/>
							<span class="font-semibold">Campaign</span>
							<span class="mt-1 block text-sm text-gray-600 dark:text-gray-300">
								Sessions, wiki entries, AI updates and maps.
							</span>
						</label>
						<label class="cursor-pointer rounded border border-gray-300 p-4 dark:border-gray-700">
							<input
								type="radio"
								name="kind"
								value="armoury"
								checked={form?.values?.kind === 'armoury'}
								class="mr-2"
							/>
							<span class="font-semibold">Armoury</span>
							<span class="mt-1 block text-sm text-gray-600 dark:text-gray-300">
								Items with checkout tracking, Player Characters and NPC records.
							</span>
						</label>
					</div>
				</fieldset>

				<label class="block">
					<span class="mb-1 block font-medium">Name</span>
					<input
						type="text"
						name="name"
						required
						value={form?.values?.name ?? ''}
						class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
						placeholder="Name your campaign..."
					/>
				</label>

				<label class="block">
					<span class="mb-1 block font-medium">Description</span>
					<textarea
						name="description"
						rows="4"
						value={form?.values?.description ?? ''}
						class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
						placeholder="A short description of the campaign..."></textarea>
				</label>

				<button
					type="submit"
					class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800"
				>
					Create
				</button>
			</form>
		</section>
	{/if}

	<section>
		<h2 class="mb-2 text-2xl font-semibold">Your campaigns and armouries</h2>
		<p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
			Passwords are securely stored and cannot be displayed after saving. This overview shows which
			player and editor credentials are configured; use Access settings to replace them.
		</p>

		{#if data.campaigns.length === 0}
			<p class="text-gray-600 dark:text-gray-300">You haven't created anything yet.</p>
		{:else}
			<ul class="space-y-3">
				{#each data.campaigns as campaign (campaign.id)}
					<li class="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-900">
						<a
							href={campaign.kind === 'armoury'
								? resolve('/campaigns/[slug]/armoury', { slug: campaign.slug })
								: resolve('/campaigns/[slug]/wiki', { slug: campaign.slug })}
							class="block rounded p-2 hover:bg-purple-50 dark:hover:bg-gray-800"
						>
							<div class="flex flex-wrap items-center justify-between gap-2">
								<h3 class="text-xl font-semibold">{campaign.name}</h3>
								<span
									class="rounded-full px-2.5 py-1 text-xs font-semibold"
									class:bg-green-100={campaign.kind === 'armoury'}
									class:text-green-800={campaign.kind === 'armoury'}
									class:dark:bg-green-950={campaign.kind === 'armoury'}
									class:dark:text-green-200={campaign.kind === 'armoury'}
									class:bg-purple-100={campaign.kind === 'campaign'}
									class:text-purple-800={campaign.kind === 'campaign'}
									class:dark:bg-purple-950={campaign.kind === 'campaign'}
									class:dark:text-purple-200={campaign.kind === 'campaign'}
								>
									{campaign.kind === 'armoury' ? 'Armoury' : 'Campaign'}
								</span>
							</div>

							{#if campaign.description}
								<p class="mt-1 text-gray-600 dark:text-gray-300">{campaign.description}</p>
							{/if}
						</a>

						<div class="mt-3 grid gap-3 px-2 text-sm sm:grid-cols-2">
							<div class="rounded bg-gray-50 p-3 dark:bg-gray-800">
								<p class="font-semibold">Player access</p>
								{#if campaign.playerCredential}
									<p class="mt-1 text-green-700 dark:text-green-300">Password configured</p>
									<p class="text-gray-500 dark:text-gray-400">
										Last changed {formatCredentialDate(campaign.playerCredential.updatedAt)}
									</p>
								{:else}
									<p class="mt-1 text-amber-700 dark:text-amber-300">No password configured</p>
								{/if}
							</div>

							<div class="rounded bg-gray-50 p-3 dark:bg-gray-800">
								<p class="font-semibold">Editor access</p>
								{#if campaign.editors.length > 0}
									<ul class="mt-1 space-y-1">
										{#each campaign.editors as editor (editor.id)}
											<li>
												<span class="text-green-700 dark:text-green-300">{editor.label}</span>
												<span class="text-gray-500 dark:text-gray-400">
													— updated {formatCredentialDate(editor.updatedAt)}
												</span>
											</li>
										{/each}
									</ul>
								{:else}
									<p class="mt-1 text-amber-700 dark:text-amber-300">No editors configured</p>
								{/if}
							</div>
						</div>

						<div
							class="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-200 px-2 pt-3 dark:border-gray-700"
						>
							<a
								href={resolve('/campaigns/[slug]/access', { slug: campaign.slug })}
								class="rounded border border-purple-700 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-gray-800"
							>
								Manage access
							</a>

							<form
								method="POST"
								action="?/delete"
								use:enhance
								onsubmit={(event) => {
									if (
										!globalThis.confirm(
											`Permanently delete “${campaign.name}” and everything stored inside it? This cannot be undone.`
										)
									) {
										event.preventDefault();
									}
								}}
							>
								<input type="hidden" name="campaignId" value={campaign.id} />
								<button
									type="submit"
									class="rounded border border-red-700 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950"
								>
									Delete {campaign.kind === 'armoury' ? 'armoury' : 'campaign'}
								</button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
