<script lang="ts">
	import { browser } from '$app/environment';
	import { onNavigate } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
	let showRouteProgress = $state(false);
	let routeProgress = $state(0);
	let progressDelayTimer: ReturnType<typeof setTimeout> | undefined;
	let progressTickTimer: ReturnType<typeof setInterval> | undefined;
	let progressHideTimer: ReturnType<typeof setTimeout> | undefined;

	type ViewTransitionDocument = Document & {
		startViewTransition?: (updateCallback: () => Promise<void> | void) => unknown;
	};

	const clearProgressTimers = () => {
		if (progressDelayTimer) {
			clearTimeout(progressDelayTimer);
			progressDelayTimer = undefined;
		}

		if (progressTickTimer) {
			clearInterval(progressTickTimer);
			progressTickTimer = undefined;
		}

		if (progressHideTimer) {
			clearTimeout(progressHideTimer);
			progressHideTimer = undefined;
		}
	};

	const startRouteProgress = () => {
		clearProgressTimers();
		routeProgress = 0.08;
		progressDelayTimer = setTimeout(() => {
			showRouteProgress = true;
		}, 90);

		progressTickTimer = setInterval(() => {
			routeProgress += (0.9 - routeProgress) * 0.2;
			if (routeProgress > 0.9) routeProgress = 0.9;
		}, 120);
	};

	const finishRouteProgress = () => {
		clearProgressTimers();
		routeProgress = 1;
		showRouteProgress = true;
		progressHideTimer = setTimeout(() => {
			showRouteProgress = false;
			routeProgress = 0;
			progressHideTimer = undefined;
		}, 220);
	};

	if (browser) {
		onNavigate((navigation) => {
			const viewTransitionDocument = document as ViewTransitionDocument;
			const startViewTransition = viewTransitionDocument.startViewTransition;
			startRouteProgress();

			if (!startViewTransition) {
				void navigation.complete.then(finishRouteProgress, finishRouteProgress);
				return;
			}

			return new Promise<void>((resolve) => {
				startViewTransition.call(viewTransitionDocument, async () => {
					resolve();
					try {
						await navigation.complete;
					} finally {
						finishRouteProgress();
					}
				});
			});
		});
	}

	onDestroy(() => {
		clearProgressTimers();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class={`route-progress${showRouteProgress ? ' is-visible' : ''}`} aria-hidden="true">
	<div class="route-progress__bar" style={`transform: scaleX(${routeProgress});`}></div>
</div>

{@render children()}
