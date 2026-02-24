<script lang="ts">
	import { Home, Plus } from 'lucide-svelte';

	const navItems = [
		{ icon: Home, label: 'Home', href: '/' }
	];
</script>

<aside class="flex flex-col h-full py-4 px-2">
	<!-- Logo -->
	<div class="px-4 mb-6">
		<a href="/" class="text-2xl font-bold text-primary">Sphere</a>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-1">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-base-200 transition-colors group"
			>
				<item.icon class="w-6 h-6 group-hover:text-primary transition-colors" />
				<span class="text-lg font-medium hidden xl:block">{item.label}</span>
			</a>
		{/each}
	</nav>

	<!-- Compose Button -->
	<div class="px-4 mt-4">
		<button class="btn btn-primary btn-lg w-full rounded-full shadow-lg hover:shadow-xl transition-shadow">
			<Plus class="w-6 h-6 xl:hidden" />
			<span class="hidden xl:inline">New Post</span>
		</button>
	</div>

	<!-- User Profile Mini -->
	<div class="mt-4 px-2">
		<button class="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors w-full">
			<div class="avatar placeholder">
				<div class="bg-primary text-primary-content w-10 h-10 rounded-full">
					<span class="text-sm font-medium">YO</span>
				</div>
			</div>
			<div class="hidden xl:block text-left">
				<div class="font-semibold text-sm">Your Name</div>
				<div class="text-base-content/50 text-xs">@username</div>
			</div>
		</button>
	</div>
</aside>
