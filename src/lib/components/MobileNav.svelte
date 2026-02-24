<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	import { House, Plus, Search, Menu, Compass, LogIn, LogOut, User } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { getFileUrl } from '$lib/utils/files';

	let menuOpen = $state(false);
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

	function handleLogout() {
		auth.logout();
		menuOpen = false;
	}

	const displayName = $derived(auth.user?.nick || auth.user?.name || '');
	const username = $derived(auth.user?.name || '');
	const avatarUrl = $derived(
		auth.user?.profile?.picture?.url || getFileUrl(auth.user?.profile?.picture?.id)
	);
</script>

<svelte:window onclick={handleClickOutside} />

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
				<button class="btn btn-ghost btn-sm btn-circle" onclick={toggleMenu} aria-label="Menu">
					<Menu class="w-5 h-5" />
				</button>

				<!-- Dropdown Menu -->
				{#if menuOpen}
					<div class="absolute right-0 top-full mt-2 w-48 bg-base-100 rounded-xl shadow-lg border border-base-300 py-2 z-50">
						{#if auth.isAuthenticated && auth.user}
							<div class="px-4 py-3 border-b border-base-200 mb-1">
								<div class="flex items-center gap-3">
									{#if avatarUrl}
										<div class="avatar">
											<div class="w-9 rounded-full">
												<img src={avatarUrl} alt={username} />
											</div>
										</div>
									{:else}
										<div class="avatar avatar-placeholder">
											<div class="bg-primary text-primary-content w-9 rounded-full">
												<span class="text-xs font-medium">{(username || '?').slice(0, 2).toUpperCase()}</span>
											</div>
										</div>
									{/if}
									<div class="min-w-0">
										<p class="font-medium truncate">{displayName}</p>
										<p class="text-sm text-base-content/60 truncate">@{username}</p>
									</div>
								</div>
							</div>
							<a
								href="/me"
								class="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
								onclick={closeMenu}
							>
								<User class="w-5 h-5 text-base-content/70" />
								<span class="font-medium">Profile</span>
							</a>
							<button
								class="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors w-full text-left"
								onclick={handleLogout}
							>
								<LogOut class="w-5 h-5 text-base-content/70" />
								<span class="font-medium">Logout</span>
							</button>
						{:else}
							{#each navItems as item}
								<a
									href={item.href}
									class="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors"
									onclick={closeMenu}
								>
									<item.icon class="w-5 h-5 text-base-content/70" />
									<span class="font-medium">{item.label}</span>
								</a>
							{/each}
							<div class="divider my-1"></div>
							<a
								href="/auth/login"
								class="flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors text-primary"
								onclick={closeMenu}
							>
								<LogIn class="w-5 h-5" />
								<span class="font-medium">Sign In</span>
							</a>
						{/if}
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
