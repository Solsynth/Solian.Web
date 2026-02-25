<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';

	const {
		size = 40,
		speed = 5,
		color = 'currentColor',
		text = 'o.0 0.o',
		fontSize = 16,
		fontFamily = 'inherit',
		fontWeight = 400,
		letterSpacing = '0.1em',
		animationDirection = 'normal',
		animationFillMode = 'both',
		animationPlayState = 'running',
		customClass = '',
		customStyle = '',
		children = null
	} = $props();

	// Split the text into individual patterns
	let patterns = $derived(text.split(/\s+/).filter(p => p.trim().length > 0));
	let currentIndex = $state(0);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	const updateIndex = () => {
		currentIndex = (currentIndex + 1) % patterns.length;
	};

	onMount(() => {
		// Calculate interval based on speed (higher speed = faster animation)
		// Reduced minimum interval and made it more responsive to speed
		const interval = Math.max(50, 1000 / speed);
		
		intervalId = setInterval(updateIndex, interval);
	});

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});
</script>

<style>
	.confuse-spinner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--spinner-size);
		height: var(--spinner-size);
		color: var(--spinner-color);
	}

	.confuse-spinner__text {
		font-size: var(--text-font-size);
		font-family: var(--text-font-family);
		font-weight: var(--text-font-weight);
		letter-spacing: var(--text-letter-spacing);
		white-space: nowrap;
		overflow: hidden;
		display: inline-block;
		transition: opacity 0.3s ease-in-out;
	}
</style>

<div
	class="confuse-spinner {customClass}"
	style="
		--spinner-size: {size}px;
		--spinner-color: {color};
		--animation-speed: {speed};
		--animation-direction: {animationDirection};
		--animation-fill-mode: {animationFillMode};
		--animation-play-state: {animationPlayState};
		--text-font-size: {fontSize}px;
		--text-font-family: {fontFamily};
		--text-font-weight: {fontWeight};
		--text-letter-spacing: {letterSpacing};
		{customStyle}
	"
	aria-label="Confuse Spinner"
	role="img"
>
	{#if children}
		{@render children()}
	{:else}
		<span class="confuse-spinner__text">{patterns[currentIndex]}</span>
	{/if}
</div>