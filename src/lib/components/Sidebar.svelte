<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	import { Compass, CreditCard, Radio, Plus, LogIn, LogOut, User } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { getFileUrl } from '$lib/utils/files';
	import ComposeDialog from './ComposeDialog.svelte';

	const navItems = [
		{ icon: Compass, label: 'Explore', href: '/' },
		{ icon: Radio, label: 'Livestreams', href: '/livestreams' }
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

<aside class="flex h-full flex-col items-stretch px-4 py-4">
	<!-- Logo -->
	<div class="mb-6 flex justify-end px-2">
		<a href="/" class="text-2xl font-bold text-primary">
			<img src={favicon} alt="Favicon" class="h-12 w-12" />
		</a>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-1">
		{#each navItems as item}
			<a
				href={item.href}
				class="group flex items-center justify-end gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-base-200"
			>
				<span class="text-lg font-medium transition-colors group-hover:text-primary"
					>{item.label}</span
				>
				<item.icon class="h-6 w-6 transition-colors group-hover:text-primary" />
			</a>
		{/each}
	</nav>

	<!-- Compose Button -->
	<div class="mt-4 px-2">
		<button
			class="btn w-full rounded-full shadow-lg transition-shadow btn-lg btn-primary hover:shadow-xl"
			onclick={() => (document.getElementById('compose-dialog') as HTMLDialogElement)?.showModal()}
		>
			<Plus class="h-6 w-6" />
			<span>New Post</span>
		</button>
	</div>

	<!-- User Profile Mini -->
	<div class="mt-4 px-2">
		{#if auth.isAuthenticated && auth.user}
			<div class="dropdown dropdown-end dropdown-top w-full">
				<button
					class="flex w-full items-center gap-3 rounded-xl p-3 transition-colors hover:bg-base-200"
				>
					{#if avatarUrl}
						<div class="avatar">
							<div class="w-10 rounded-full">
								<img src={avatarUrl} alt={username} />
							</div>
						</div>
					{:else}
						<div class="avatar avatar-placeholder">
							<div class="w-10 rounded-full bg-primary text-primary-content">
								<span class="text-sm font-medium">{fallbackInitials}</span>
							</div>
						</div>
					{/if}
					<div class="min-w-0 flex-1 text-left">
						<div class="truncate text-sm font-semibold">{displayName}</div>
						<div class="truncate text-xs text-base-content/50">@{username}</div>
					</div>
				</button>
				<ul class="dropdown-content menu mb-2 w-52 rounded-box bg-base-100 p-2 shadow">
					<li>
						<a href="/pricing">
							<CreditCard size={18} />
							Membership
						</a>
					</li>
					<li class="my-1 border-t border-base-300"></li>
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
			<a
				href="/auth/login"
				class="flex w-full items-center gap-3 rounded-xl p-3 transition-colors hover:bg-base-200"
			>
				<div class="avatar avatar-placeholder">
					<div class="w-10 rounded-full bg-base-300 text-base-content">
						<LogIn size={20} />
					</div>
				</div>
				<div class="text-left">
					<div class="text-sm font-semibold">Sign In</div>
					<div class="text-xs text-base-content/50">Join the community</div>
				</div>
			</a>
		{/if}
	</div>
</aside>
