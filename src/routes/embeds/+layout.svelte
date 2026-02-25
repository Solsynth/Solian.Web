<script lang="ts">
	let { children } = $props();
</script>

<div class="h-full w-full">
	{@render children()}
</div>

<style>
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: transparent !important;
	}

	:global(.embed-container) {
		width: 100%;
		height: 100%;
	}
</style>
