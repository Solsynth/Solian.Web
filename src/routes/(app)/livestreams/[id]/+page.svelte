<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import LivestreamPlayer from '$lib/components/livestreams/LivestreamPlayer.svelte';
	import { getFileUrl } from '$lib/utils/files';
	import { ArrowLeft, Clapperboard, Radio, PlayCircle, MessageCircle, Info } from 'lucide-svelte';

	type PlaybackMode = 'webrtc' | 'hls';

	let { data }: { data: PageData } = $props();

	let playbackMode = $state<PlaybackMode>('webrtc');
	let isWide = $state(false);

	const livestream = $derived(data.livestream);
	const hasHls = $derived(Boolean(resolveHlsUrl(livestream?.hlsPlaylistPath)));
	const hlsUrl = $derived(resolveHlsUrl(livestream?.hlsPlaylistPath));
	const publisherName = $derived(
		livestream?.publisher?.nick || livestream?.publisher?.name || null
	);

	function resolveHlsUrl(path?: string | null): string | null {
		if (!path || !path.trim()) return null;
		if (path.startsWith('http://') || path.startsWith('https://')) return path;
		return `https://rt.solian.app${path.startsWith('/') ? '' : '/'}${path}`;
	}

	function handleBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
			return;
		}
		goto('/');
	}

	$effect(() => {
		if (!livestream) return;
		const ended =
			livestream.status === 'ended' || livestream.status === 'ENDED' || livestream.status === 2;
		if (ended && hasHls) playbackMode = 'hls';
		if (!hasHls && playbackMode === 'hls') playbackMode = 'webrtc';
	});

	onMount(() => {
		if (typeof window === 'undefined') return;
		const media = window.matchMedia('(min-width: 1024px)');
		const sync = () => (isWide = media.matches);
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	});
</script>

<svelte:head>
	<title>{livestream?.title ?? 'Livestream'} | Solar Network</title>
</svelte:head>

<div class="sticky z-10 mb-4 max-lg:top-14 lg:top-4 lg:mb-6">
	<div class="mx-auto max-w-6xl lg:px-4">
		<div
			class="flex items-center gap-4 border-b border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur lg:-mx-3 lg:rounded-full lg:border lg:px-6 lg:shadow-lg lg:shadow-base-content/5"
		>
			<button class="btn -ml-2 btn-circle btn-ghost btn-sm" onclick={handleBack}>
				<ArrowLeft class="h-5 w-5" />
			</button>
			<div class="min-w-0">
				<h1 class="truncate text-lg font-bold">{livestream?.title ?? 'Live'}</h1>
			</div>
		</div>
	</div>
</div>

<div class="mx-auto max-w-6xl px-4 pb-6 pt-2">
	{#if data.error}
		<div class="alert alert-error">{data.error}</div>
	{:else if !livestream}
		<div class="py-14 text-center text-base-content/60">
			<Clapperboard class="mx-auto mb-3 h-8 w-8" />
			<p>Stream not found or already removed.</p>
		</div>
	{:else}
		{#if hasHls}
			<div class="card mb-4 border border-base-300 bg-base-100">
				<div class="card-body p-3">
					<div class="flex flex-wrap items-center gap-3">
						<div class="inline-flex items-center gap-2 text-sm text-base-content/70">
							<Radio class="h-4 w-4" />
							<span>Watch by</span>
						</div>
						<div class="join">
							<button
								type="button"
								class={`btn join-item btn-sm ${playbackMode === 'webrtc' ? 'btn-primary' : 'btn-ghost'}`}
								onclick={() => (playbackMode = 'webrtc')}
							>
								<Radio class="h-4 w-4" /> Live (WebRTC)
							</button>
							<button
								type="button"
								class={`btn join-item btn-sm ${playbackMode === 'hls' ? 'btn-primary' : 'btn-ghost'}`}
								onclick={() => (playbackMode = 'hls')}
							>
								<PlayCircle class="h-4 w-4" /> Replay (HLS)
							</button>
						</div>
						{#if livestream.status === 'ended' || livestream.status === 2}
							<span class="ml-auto badge badge-outline">Ended</span>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<div class="grid gap-4">
			<div class="space-y-4">
				{#if playbackMode === 'webrtc'}
					<LivestreamPlayer
						livestreamId={livestream.id ?? data.livestream?.id ?? ''}
						isInteractive={true}
						showChat={true}
					/>
				{:else}
					<div class="card border border-base-300 bg-base-100">
						<div class="card-body p-3">
							<div class="relative overflow-hidden rounded-xl bg-black">
								<video
									class="aspect-video h-full w-full"
									controls
									playsinline
									src={hlsUrl ?? ''}
									preload="metadata"
								>
									<track kind="captions" />
								</video>
							</div>
						</div>
					</div>
				{/if}

				{#if publisherName}
					<div class="card border border-base-300 bg-base-100">
						<a
							class="card-body cursor-pointer p-3 hover:bg-base-200/30"
							href={livestream.publisher?.name
								? `/publishers/${livestream.publisher.name}`
								: undefined}
						>
							<div class="flex items-center gap-3">
								{#if livestream.publisher?.picture?.id}
									<img
										src={getFileUrl(livestream.publisher.picture.id)}
										alt={publisherName}
										class="h-10 w-10 rounded-full object-cover"
										loading="lazy"
									/>
								{:else}
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold"
									>
										{publisherName[0].toUpperCase()}
									</div>
								{/if}
								<div class="min-w-0">
									<div class="truncate text-sm font-semibold">{publisherName}</div>
									{#if livestream.publisher?.name}
										<div class="truncate text-xs text-base-content/60">
											@{livestream.publisher.name}
										</div>
									{/if}
								</div>
							</div>
						</a>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
