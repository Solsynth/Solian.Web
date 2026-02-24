<script lang="ts">
	import './layout.css';
	import { Home, Plus, Search, Menu } from 'lucide-svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-base-100">
	<!-- Top Navigation Bar -->
	<header class="sticky top-0 z-50 bg-base-100/95 backdrop-blur border-b border-base-300">
		<div class="max-w-2xl mx-auto px-4">
			<div class="flex items-center justify-between h-14">
				<!-- Left: Home link -->
				<a href="/" class="btn btn-ghost btn-sm btn-circle">
					<Home class="w-5 h-5" />
				</a>

				<!-- Center: Logo -->
				<a href="/" class="text-xl font-bold text-primary">Sphere</a>

				<!-- Right: Actions -->
				<div class="flex items-center gap-1">
					<button class="btn btn-ghost btn-sm btn-circle">
						<Search class="w-5 h-5" />
					</button>
					<button class="btn btn-ghost btn-sm btn-circle">
						<Menu class="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-2xl mx-auto min-h-[calc(100vh-3.5rem)]">
		{@render children()}
	</main>

	<!-- Floating Compose Button (Mobile) -->
	<button class="sm:hidden btn btn-primary btn-circle fixed bottom-6 right-6 shadow-lg z-40 w-14 h-14">
		<Plus class="w-6 h-6" />
	</button>
</div>
