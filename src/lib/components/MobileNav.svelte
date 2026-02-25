<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	import { House, Plus, Search, Menu, Compass, LogIn, LogOut, User } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { getFileUrl } from '$lib/utils/files';

	let menuOpen = $state(false);
	let menuContainer: HTMLDivElement;

	const navItems = [
		{ icon: House, label: 'Home', href: '/' },
		{ icon: Compass, label: 'Explore', href: '/' }
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

<header
	class="fixed top-0 right-0 left-0 z-50 border-b border-base-300 bg-base-100/95 backdrop-blur lg:hidden"
>
	<div class="mx-auto max-w-2xl px-4">
		<div class="flex h-14 items-center justify-between">
			<!-- Left: Home -->
			<a href="/" class="btn btn-circle btn-ghost btn-sm">
				<House class="h-5 w-5" />
			</a>

			<!-- Center: Logo -->
			<a href="/" class="text-xl font-bold text-primary">
				<img src={favicon} alt="Favicon" class="h-8 w-8" />
			</a>

			<!-- Right: Actions -->
			<div class="relative flex items-center gap-1" bind:this={menuContainer}>
				<button class="btn btn-circle btn-ghost btn-sm" onclick={toggleMenu} aria-label="Menu">
					<Menu class="h-5 w-5" />
				</button>

				<!-- Dropdown Menu -->
				{#if menuOpen}
					<div
						class="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-base-300 bg-base-100 py-2 shadow-lg"
					>
						{#if auth.isAuthenticated && auth.user}
							<div class="mb-1 border-b border-base-200 px-4 py-3">
								<div class="flex items-center gap-3">
									{#if avatarUrl}
										<div class="avatar">
											<div class="w-9 rounded-full">
												<img src={avatarUrl} alt={username} />
											</div>
										</div>
									{:else}
										<div class="avatar avatar-placeholder">
											<div class="w-9 rounded-full bg-primary text-primary-content">
												<span class="text-xs font-medium"
													>{(username || '?').slice(0, 2).toUpperCase()}</span
												>
											</div>
										</div>
									{/if}
									<div class="min-w-0">
										<p class="truncate font-medium">{displayName}</p>
										<p class="truncate text-sm text-base-content/60">@{username}</p>
									</div>
								</div>
							</div>
							<a
								href="/me"
								class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-200"
								onclick={closeMenu}
							>
								<User class="h-5 w-5 text-base-content/70" />
								<span class="font-medium">Profile</span>
							</a>
							<button
								class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-base-200"
								onclick={handleLogout}
							>
								<LogOut class="h-5 w-5 text-base-content/70" />
								<span class="font-medium">Logout</span>
							</button>
						{:else}
							{#each navItems as item}
								<a
									href={item.href}
									class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-200"
									onclick={closeMenu}
								>
									<item.icon class="h-5 w-5 text-base-content/70" />
									<span class="font-medium">{item.label}</span>
								</a>
							{/each}
							<div class="divider my-1"></div>
							<a
								href="/auth/login"
								class="flex items-center gap-3 px-4 py-3 text-primary transition-colors hover:bg-base-200"
								onclick={closeMenu}
							>
								<LogIn class="h-5 w-5" />
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
<button
	class="btn fixed right-6 bottom-6 z-40 btn-circle h-14 w-14 shadow-lg btn-primary lg:hidden"
>
	<Plus class="h-6 w-6" />
</button>
