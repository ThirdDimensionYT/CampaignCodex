<script lang="ts">
	import { onMount } from 'svelte';

	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	let darkMode = $state(false);

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');

		darkMode =
			savedTheme === 'dark' ||
			(savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);

		document.documentElement.classList.toggle('dark', darkMode);
	});

	function toggleTheme() {
		darkMode = !darkMode;

		document.documentElement.classList.toggle('dark', darkMode);
		localStorage.setItem('theme', darkMode ? 'dark' : 'light');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div
	class="min-h-screen bg-white text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100"
>
	<button
		type="button"
		onclick={toggleTheme}
		aria-label="Toggle colour theme"
		aria-pressed={darkMode}
		class="fixed top-4 right-4 z-50 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
	>
		{darkMode ? '☀️ Light mode' : '🌙 Dark mode'}
	</button>

	{@render children()}
</div>
