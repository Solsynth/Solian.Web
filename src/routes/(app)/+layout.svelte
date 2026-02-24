<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import RightSidebar from '$lib/components/RightSidebar.svelte';
	import MobileNav from '$lib/components/MobileNav.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-base-100">
	<!-- Mobile Top Navigation -->
	<MobileNav />

	<div class="mx-auto flex max-w-350 justify-center">
		<!-- Left Sidebar (Navigation) - Desktop only -->
		<div class="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
			<Sidebar />
		</div>

		<!-- Main Content -->
		<main
			class="min-h-screen w-full lg:max-w-2xl min-w-0 flex-1 border-base-300 pt-14 lg:border-x lg:pt-0"
		>
			{@render children()}
		</main>

		<!-- Right Sidebar (Legal/Info) - Desktop only -->
		<div class="sticky top-0 hidden h-screen w-80 shrink-0 px-4 xl:block">
			<RightSidebar />
		</div>
	</div>

	<!-- Legal Info Footer - Mobile only -->
	<div class="mt-8 border-t border-base-300 px-4 py-6 text-center lg:hidden">
		<p class="text-sm text-base-content/50">© {new Date().getFullYear()} Solar Network</p>
	</div>
</div>
