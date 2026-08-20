<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let uploading = $state(false);
	let savingMarker = $state(false);
	let selectedLocationId = $state('');
	let draftPositionX = $state<number | null>(null);
	let draftPositionY = $state<number | null>(null);

	function chooseMarkerPosition(event: MouseEvent) {
		if (!data.canEdit || !data.campaignMap) return;

		const mapElement = event.currentTarget as HTMLElement;
		const bounds = mapElement.getBoundingClientRect();

		draftPositionX = Math.round(((event.clientX - bounds.left) / bounds.width) * 10_000);
		draftPositionY = Math.round(((event.clientY - bounds.top) / bounds.height) * 10_000);
	}

	function formatFileSize(sizeBytes: number): string {
		return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
	}
</script>

<svelte:head>
	<title>Map | {data.campaign.name}</title>
	<meta name="description" content={`Explore the interactive map for ${data.campaign.name}`} />
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 p-6">
	<a href={resolve('/')} class="text-purple-700 hover:underline dark:text-purple-400">
		← All campaigns
	</a>

	<header class="border-b border-gray-200 pb-6 dark:border-gray-700">
		<p class="font-semibold text-purple-700 dark:text-purple-400">{data.campaign.name}</p>
		<h1 class="mt-1 text-4xl font-bold">Campaign Map</h1>
		<p class="mt-3 text-gray-600 dark:text-gray-300">
			Explore important locations and open their linked Wiki entries.
		</p>
	</header>

	<nav
		class="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700"
		aria-label="Campaign"
	>
		<a
			href={resolve('/campaigns/[slug]/wiki', { slug: data.campaign.slug })}
			class="border-b-2 border-transparent px-4 py-3 font-medium whitespace-nowrap text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
		>
			Wiki
		</a>
		<a
			href={resolve('/campaigns/[slug]', { slug: data.campaign.slug })}
			class="border-b-2 border-transparent px-4 py-3 font-medium whitespace-nowrap text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
		>
			Sessions
		</a>
		<a
			href={resolve('/campaigns/[slug]/map', { slug: data.campaign.slug })}
			aria-current="page"
			class="border-b-2 border-purple-700 px-4 py-3 font-medium whitespace-nowrap text-purple-700 dark:border-purple-400 dark:text-purple-400"
		>
			Map
		</a>
	</nav>

	{#if data.canEdit}
		<section class="rounded-lg border border-gray-200 p-5 dark:border-gray-700">
			{#if data.campaignMap}
				<details>
					<summary class="cursor-pointer font-semibold">Replace map image</summary>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
						Replacing the image keeps the existing location markers in their current positions.
					</p>
					<div class="mt-5">
						<form
							method="POST"
							action="?/upload"
							enctype="multipart/form-data"
							use:enhance={() => {
								uploading = true;
								return async ({ update }) => {
									try {
										await update();
									} finally {
										uploading = false;
									}
								};
							}}
							class="space-y-4"
						>
							<label class="block">
								<span class="mb-1 block font-medium">Map name</span>
								<input
									name="name"
									maxlength="100"
									value={data.campaignMap.name}
									class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
								/>
							</label>
							<label class="block">
								<span class="mb-1 block font-medium">New map image</span>
								<input
									type="file"
									name="mapImage"
									accept="image/png,image/jpeg,image/webp"
									required
									class="block w-full rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
								/>
							</label>
							{#if form?.message && form.section === 'upload'}
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
							<button
								type="submit"
								disabled={uploading}
								class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800 disabled:cursor-wait disabled:opacity-60"
								>{uploading ? 'Uploading…' : 'Replace map'}</button
							>
						</form>
					</div>
				</details>
			{:else}
				<h2 class="text-2xl font-semibold">Upload the regional map</h2>
				<p class="mt-2 text-gray-600 dark:text-gray-300">
					Use a PNG, JPEG or WebP image no larger than 10 MB.
				</p>
				<form
					method="POST"
					action="?/upload"
					enctype="multipart/form-data"
					use:enhance={() => {
						uploading = true;
						return async ({ update }) => {
							try {
								await update();
							} finally {
								uploading = false;
							}
						};
					}}
					class="mt-5 space-y-4"
				>
					<label class="block">
						<span class="mb-1 block font-medium">Map name</span>
						<input
							name="name"
							maxlength="100"
							placeholder="Regional map"
							class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
						/>
					</label>
					<label class="block">
						<span class="mb-1 block font-medium">Map image</span>
						<input
							type="file"
							name="mapImage"
							accept="image/png,image/jpeg,image/webp"
							required
							class="block w-full rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
						/>
					</label>
					{#if form?.message && form.section === 'upload'}
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
					<button
						type="submit"
						disabled={uploading}
						class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800 disabled:cursor-wait disabled:opacity-60"
						>{uploading ? 'Uploading…' : 'Upload map'}</button
					>
				</form>
			{/if}
		</section>
	{/if}

	{#if data.campaignMap}
		<section class="space-y-4">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 class="text-2xl font-semibold">{data.campaignMap.name}</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						{data.campaignMap.originalFilename} · {formatFileSize(data.campaignMap.sizeBytes)}
					</p>
				</div>
				{#if data.canEdit}
					<p class="text-sm font-medium text-purple-700 dark:text-purple-400">
						Click the map to position a marker.
					</p>
				{/if}
			</div>

			<div
				class="overflow-auto rounded-lg border border-gray-300 bg-gray-100 p-2 dark:border-gray-700 dark:bg-gray-900"
			>
				<div class="relative mx-auto w-fit max-w-full">
					<img
						src={resolve('/campaigns/[slug]/map/image', { slug: data.campaign.slug })}
						alt={data.campaignMap.name}
						class="block h-auto max-h-[75vh] max-w-full select-none"
						draggable="false"
					/>

					{#if data.canEdit}
						<button
							type="button"
							onclick={chooseMarkerPosition}
							class="absolute inset-0 z-10 cursor-crosshair"
							aria-label="Choose a position for a new location marker"
						></button>
					{/if}

					{#each data.markers as marker (marker.id)}
						<a
							href={resolve('/campaigns/[slug]/wiki/[entitySlug]', {
								slug: data.campaign.slug,
								entitySlug: marker.slug
							})}
							onclick={(event) => event.stopPropagation()}
							style={`left: ${marker.positionX / 100}%; top: ${marker.positionY / 100}%;`}
							class="group absolute z-20 -translate-x-1/2 -translate-y-full focus:outline-none"
							aria-label={`Open ${marker.name} Wiki entry`}
						>
							<span
								class="block text-3xl drop-shadow-md transition-transform group-hover:scale-125 group-focus:scale-125"
								aria-hidden="true">📍</span
							>
							<span
								class="absolute bottom-full left-1/2 mb-1 hidden w-max max-w-52 -translate-x-1/2 rounded bg-gray-950 px-2 py-1 text-center text-xs text-white shadow-lg group-hover:block group-focus:block"
								>{marker.name}</span
							>
						</a>
					{/each}

					{#if data.canEdit && draftPositionX !== null && draftPositionY !== null}
						<span
							style={`left: ${draftPositionX / 100}%; top: ${draftPositionY / 100}%;`}
							class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full text-3xl opacity-70"
							aria-hidden="true">📌</span
						>
					{/if}
				</div>
			</div>

			{#if data.canEdit}
				<div class="rounded-lg border border-gray-200 p-5 dark:border-gray-700">
					<h3 class="text-xl font-semibold">Add or move a location marker</h3>
					{#if data.locations.length === 0}
						<p class="mt-3 text-gray-600 dark:text-gray-300">
							Create a Location entry in the Wiki before adding map markers.
						</p>
					{:else}
						<form
							method="POST"
							action="?/saveMarker"
							use:enhance={() => {
								savingMarker = true;
								return async ({ update }) => {
									try {
										await update();
										if (form?.success) {
											draftPositionX = null;
											draftPositionY = null;
										}
									} finally {
										savingMarker = false;
									}
								};
							}}
							class="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
						>
							<label class="block">
								<span class="mb-1 block font-medium">Location Wiki entry</span>
								<select
									name="entityId"
									bind:value={selectedLocationId}
									required
									class="w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
								>
									<option value="">Choose a location…</option>
									{#each data.locations as location (location.id)}
										<option value={location.id}>{location.name}</option>
									{/each}
								</select>
							</label>
							<input type="hidden" name="positionX" value={draftPositionX ?? ''} />
							<input type="hidden" name="positionY" value={draftPositionY ?? ''} />
							<button
								type="submit"
								disabled={savingMarker || draftPositionX === null || !selectedLocationId}
								class="rounded bg-purple-700 px-4 py-2 font-medium text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
								>{savingMarker ? 'Saving…' : 'Save marker'}</button
							>
						</form>
					{/if}

					{#if form?.message && form.section === 'marker'}
						<p
							aria-live="polite"
							class="mt-4 rounded p-3"
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
				</div>

				{#if data.markers.length > 0}
					<div class="space-y-2">
						<h3 class="font-semibold">Current markers</h3>
						{#each data.markers as marker (marker.id)}
							<div
								class="flex items-center justify-between gap-4 rounded border border-gray-200 px-4 py-3 dark:border-gray-700"
							>
								<span>{marker.name}</span>
								<form method="POST" action="?/removeMarker" use:enhance>
									<input type="hidden" name="markerId" value={marker.id} />
									<button
										type="submit"
										class="font-medium text-red-700 hover:underline dark:text-red-400"
										>Remove</button
									>
								</form>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</section>
	{:else if !data.canEdit}
		<p
			class="rounded border border-gray-200 p-6 text-gray-600 dark:border-gray-700 dark:text-gray-300"
		>
			No campaign map has been uploaded yet.
		</p>
	{/if}
</main>
