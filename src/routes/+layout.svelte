<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { resolveSeo, SITE_NAME, type SeoData } from '$lib/seo';
	import { Toaster } from 'svelte-french-toast';
	import favicon from '$lib/assets/favicon.png';
	import './layout.css';
	import ComposeDialog from '$lib/components/ComposeDialog.svelte';

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

	const seo = $derived.by(() => {
		const routeData = ($page.data ?? {}) as { seo?: SeoData; robots?: string };
		return resolveSeo($page.url, routeData.seo, routeData.robots);
	});
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<meta name="robots" content={seo.robots} />
	{#if seo.keywords}
		<meta name="keywords" content={seo.keywords} />
	{/if}
	<link rel="canonical" href={seo.canonical} />
	<link rel="icon" href={favicon} />

	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:type" content={seo.type} />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:url" content={seo.canonical} />
	<meta property="og:image" content={seo.image} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={seo.image} />

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class={`route-progress${showRouteProgress ? ' is-visible' : ''}`} aria-hidden="true">
	<div class="route-progress__bar" style={`transform: scaleX(${routeProgress});`}></div>
</div>

<Toaster />

<ComposeDialog />

{@render children()}
