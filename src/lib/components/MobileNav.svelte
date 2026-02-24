<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	import { House, Plus, Search, Menu } from 'lucide-svelte';
</script>

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
			<div class="flex items-center gap-1">
				<button class="btn btn-ghost btn-sm btn-circle">
					<Menu class="w-5 h-5" />
				</button>
			</div>
		</div>
	</div>
</header>

<!-- Floating Compose Button (Mobile) -->
<button class="lg:hidden btn btn-primary btn-circle fixed bottom-6 right-6 shadow-lg z-40 w-14 h-14">
	<Plus class="w-6 h-6" />
</button>
