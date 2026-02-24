<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	import { House, Plus, Search, Menu, Compass } from 'lucide-svelte';

	let menuOpen = false;
	let menuContainer: HTMLDivElement;

	const navItems = [
		{ icon: House, label: 'Home', href: '/' },
		{ icon: Compass, label: 'Explore', href: '/' },
	];

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleClickOutside(event: MouseEvent) {
		if (menuContainer && !menuContainer.contains(event.target as Node)) {
			menuOpen = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<header class="lg:hidden fixed top-0 left-0 right-0 z-50 bg-base-100/95 backdrop-blur border-b border-base-300">
	<div class="max-w-2xl mx-auto px-4">
		<div class="flex items-center justify-between h-14">
			<!-- Left: Home -->
			<a href="/" class="btn btn-ghost btn-sm btn-circle">
				<House class="w-5 h-5" />
			</a>

			<!-- Center: Logo -->
			<a href="/" class="text-xl font-bold text-primary">
				<img src={favicon} alt="Favicon" class="w-8 h-8" />
			</a>

			<!-- Right: Actions -->
			<div class="flex items-center gap-1 relative" bind:this={menuContainer}>
				<button class="btn btn-ghost btn-sm btn-circle" on:click={toggleMenu} aria-label="Menu">
					<Menu class="w-5 h-5" />
				</button>

				<!-- Dropdown Menu -->
				{#if menuOpen}
					<div class="absolute right-0 top-full mt-2 w-48 bg-base-100 rounded-xl shadow-lg border border-base-300 py-2 z-50">
						{#each navItems as item}
							<a
								href={item.href}
								class="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
								on:click={closeMenu}
							>
								<item.icon class="w-5 h-5 text-base-content/70" />
								<span class="font-medium">{item.label}</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>

<!-- Floating Compose Button (Mobile) -->
<button class="lg:hidden btn btn-primary btn-circle fixed bottom-6 right-6 shadow-lg z-40 w-14 h-14">
	<Plus class="w-6 h-6" />
</button>
