<script lang="ts">
	import '../layout.css';
	import { onMount } from 'svelte';
	import { pickBackgroundForTheme, resolveThemeMode } from '$lib/utils/background';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
	let backgroundUrl = $state<string | null>(pickBackgroundForTheme('light'));

	onMount(() => {
		const applyThemeBackground = () => {
			const mode = resolveThemeMode();
			backgroundUrl = pickBackgroundForTheme(mode);
		};

		applyThemeBackground();

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleMediaChange = () => applyThemeBackground();
		mediaQuery.addEventListener('change', handleMediaChange);

		const observer = new MutationObserver(() => applyThemeBackground());
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme', 'class']
		});

		return () => {
			mediaQuery.removeEventListener('change', handleMediaChange);
			observer.disconnect();
		};
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="relative flex min-h-screen flex-col">
	<!-- Background Image -->
	<div
		class="absolute inset-0 bg-cover bg-center bg-no-repeat"
		style={`background-image: ${backgroundUrl ? `url('${backgroundUrl}')` : 'none'};`}
	>
		<div class="absolute inset-0 bg-base-100/80 backdrop-blur-sm"></div>
	</div>

	<!-- Content -->
	<div class="relative flex flex-1 flex-col items-center justify-center p-4">
		{@render children()}

		<!-- Footer -->
		<footer class="mt-8 text-center">
			<p class="text-sm text-base-content/60">
				© {new Date().getFullYear()} Solar Network
			</p>
			<div class="mt-2 flex justify-center gap-4 text-xs text-base-content/50">
				<a href="https://solsynth.dev/terms" class="hover:underline">Terms</a>
				<a href="https://solsynth.dev/privacy" class="hover:underline">Privacy</a>
				<a href="https://github.com/solsynth" class="hover:underline">GitHub</a>
			</div>
		</footer>
	</div>
</div>
