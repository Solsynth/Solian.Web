<script lang="ts">
	import { Home } from 'lucide-svelte';

	const navItems = [
		{ icon: Home, label: 'Home', href: '/' }
	];

	let activePath = $state('/');
</script>

<nav class="sm:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 z-50">
	<div class="flex items-center justify-around">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex flex-col items-center py-2 px-4 text-xs {activePath === item.href ? 'text-primary' : 'text-base-content/60'}"
				onclick={() => activePath = item.href}
			>
				<item.icon class="w-6 h-6 mb-0.5" />
				<span>{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
