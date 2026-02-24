<script lang="ts">
	import '../layout.css';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen relative flex flex-col">
	<!-- Background Image -->
	<div
		class="absolute inset-0 bg-cover bg-center bg-no-repeat"
		style="background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80');"
	>
		<div class="absolute inset-0 bg-base-100/80 backdrop-blur-sm"></div>
	</div>

	<!-- Content -->
	<div class="relative flex-1 flex flex-col items-center justify-center p-4">
		{@render children()}

		<!-- Footer -->
		<footer class="mt-8 text-center">
			<p class="text-sm text-base-content/60">
				© {new Date().getFullYear()} Solar Network
			</p>
			<div class="mt-2 flex gap-4 justify-center text-xs text-base-content/50">
				<a href="https://solsynth.dev/terms" class="hover:underline">Terms</a>
				<a href="https://solsynth.dev/privacy" class="hover:underline">Privacy</a>
				<a href="https://github.com/solsynth" class="hover:underline">GitHub</a>
			</div>
		</footer>
	</div>
</div>
