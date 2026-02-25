<script lang="ts">
	import '../layout.css';
	import { onMount } from 'svelte';
	import { pickBackgroundForTheme, resolveThemeMode } from '$lib/utils/background';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import RightSidebar from '$lib/components/RightSidebar.svelte';
	import MobileNav from '$lib/components/MobileNav.svelte';

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

<div
	class="app-shell min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
	style={`background-image: ${backgroundUrl ? `url('${backgroundUrl}')` : 'none'};`}
>
	<div class="min-h-screen bg-base-100/75">
	<!-- Mobile Top Navigation -->
	<MobileNav />

	<div class="mx-auto flex max-w-350 justify-center">
		<!-- Left Sidebar (Navigation) - Desktop only -->
		<div class="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
			<Sidebar />
		</div>

		<!-- Main Content -->
		<main
			class="min-h-screen w-full lg:max-w-2xl min-w-0 flex-1 pt-14 lg:pt-0"
		>
			{@render children()}
		</main>

		<!-- Right Sidebar (Legal/Info) - Desktop only -->
		<div class="sticky top-0 hidden h-screen w-80 shrink-0 px-4 xl:block">
			<RightSidebar />
		</div>
	</div>

	<!-- Legal Info Footer - Mobile only -->
	<div class="mt-8 border-base-300 px-4 py-6 text-center lg:hidden">
		<p class="text-sm text-base-content/50">© {new Date().getFullYear()} Solar Network</p>
	</div>
	</div>
</div>
