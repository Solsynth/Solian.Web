<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	import { Compass, Plus, LogIn, LogOut, User } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { getFileUrl } from '$lib/utils/files';

	const navItems = [
		{ icon: Compass, label: 'Explore', href: '/' },
	];

	function handleLogout() {
		auth.logout();
		window.location.href = '/';
	}

	const displayName = $derived(auth.user?.nick || auth.user?.name || '');
	const username = $derived(auth.user?.name || '');
	const avatarUrl = $derived(
		auth.user?.profile?.picture?.url || getFileUrl(auth.user?.profile?.picture?.id)
	);
	const fallbackInitials = $derived((username || '?').slice(0, 2).toUpperCase());
</script>

<aside class="flex flex-col h-full py-4 px-4 items-stretch">
	<!-- Logo -->
	<div class="px-2 mb-6 flex justify-end">
		<a href="/" class="text-2xl font-bold text-primary">
			<img src={favicon} alt="Favicon" class="w-12 h-12" />
		</a>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-1">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center justify-end gap-4 px-4 py-3 rounded-xl hover:bg-base-200 transition-colors group"
			>
				<span class="text-lg font-medium group-hover:text-primary transition-colors">{item.label}</span>
				<item.icon class="w-6 h-6 group-hover:text-primary transition-colors" />
			</a>
		{/each}
	</nav>

	<!-- Compose Button -->
	<div class="px-2 mt-4">
		<button class="btn btn-primary btn-lg w-full rounded-full shadow-lg hover:shadow-xl transition-shadow">
			<Plus class="w-6 h-6" />
			<span>New Post</span>
		</button>
	</div>

	<!-- User Profile Mini -->
	<div class="mt-4 px-2">
		{#if auth.isAuthenticated && auth.user}
			<div class="dropdown dropdown-end dropdown-top w-full">
				<button class="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors w-full">
					<div class="avatar placeholder">
						{#if avatarUrl}
							<img src={avatarUrl} alt={username} class="w-10 h-10 rounded-full" />
						{:else}
							<div class="bg-primary text-primary-content w-10 h-10 rounded-full">
								<span class="text-sm font-medium">{fallbackInitials}</span>
							</div>
						{/if}
					</div>
					<div class="text-left flex-1 min-w-0">
						<div class="font-semibold text-sm truncate">{displayName}</div>
						<div class="text-base-content/50 text-xs truncate">@{username}</div>
					</div>
				</button>
				<ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mb-2">
					<li>
						<a href="/me">
							<User size={18} />
							Profile
						</a>
					</li>
					<li>
						<button onclick={handleLogout}>
							<LogOut size={18} />
							Logout
						</button>
					</li>
				</ul>
			</div>
		{:else}
			<a href="/auth/login" class="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors w-full">
				<div class="avatar placeholder">
					<div class="bg-base-300 text-base-content w-10 h-10 rounded-full">
						<LogIn size={20} />
					</div>
				</div>
				<div class="text-left">
					<div class="font-semibold text-sm">Sign In</div>
					<div class="text-base-content/50 text-xs">Join the community</div>
				</div>
			</a>
		{/if}
	</div>
</aside>
