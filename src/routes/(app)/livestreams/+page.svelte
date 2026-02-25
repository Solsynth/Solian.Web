<script lang="ts">
	import { getFileUrl } from '$lib/utils/files';
	import { AlertTriangle, Compass, Eye, Radio, RefreshCw, TvMinimal } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const livestreams = $derived(data.livestreams ?? []);

	function formatViewerCount(viewers: number | undefined): string {
		const value = viewers ?? 0;
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
		return String(value);
	}

	function getPublisherName(
		publisher: { name?: string; nick?: string } | null | undefined
	): string | null {
		return publisher?.nick || publisher?.name || null;
	}

	function getPublisherInitial(name: string | null): string {
		if (!name?.trim()) return '?';
		return name.trim().charAt(0).toUpperCase();
	}
</script>

<div class="mx-auto max-w-2xl">
	<div class="flex items-center justify-between gap-3 px-4 pt-4">
		<div>
			<h1 class="text-xl font-bold">Livestreams</h1>
			<p class="text-sm text-base-content/60">Discover streams that are live right now.</p>
		</div>
		<span class="badge gap-2 badge-outline border-error/40 bg-error/5 text-error">
			<Radio class="h-3.5 w-3.5" />
			{livestreams.length} live
		</span>
	</div>

	{#if data.error}
		<div class="p-8 text-center">
			<div class="mx-auto alert max-w-md alert-error">
				<AlertTriangle class="h-5 w-5" />
				<div>
					<p class="font-semibold">Error loading livestreams</p>
					<p class="text-sm">{data.error}</p>
				</div>
			</div>
			<a href="/livestreams" class="btn mt-4 btn-primary">
				<RefreshCw class="h-4 w-4" />
				Retry
			</a>
		</div>
	{:else if livestreams.length === 0}
		<div class="card border border-base-300 bg-base-100">
			<div class="card-body items-center py-12 text-center">
				<div class="rounded-full bg-base-200 p-4">
					<TvMinimal class="h-8 w-8 text-base-content/60" />
				</div>
				<h2 class="text-xl font-bold">No active livestreams</h2>
				<p class="max-w-lg text-base-content/60">
					There are no live streams right now. Explore more content and check back soon.
				</p>
				<div class="mt-2 card-actions">
					<a href="/" class="btn btn-primary">
						<Compass class="h-4 w-4" />
						Explore content
					</a>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-4 p-4">
			{#each livestreams as stream (stream.id)}
				<a
					href={`/livestreams/${stream.id}`}
					class="group card overflow-hidden border border-base-300 bg-base-100 shadow-sm transition hover:border-base-content/20 hover:shadow-md"
				>
					<div class="relative aspect-video bg-base-200">
						{#if getFileUrl(stream.thumbnail?.id ?? stream.thumbnailId ?? undefined)}
							<img
								src={getFileUrl(stream.thumbnail?.id ?? stream.thumbnailId ?? undefined) ?? ''}
								alt={stream.title || 'Livestream thumbnail'}
								class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
								loading="lazy"
							/>
						{:else}
							<div class="flex h-full w-full items-center justify-center bg-base-300/50">
								<TvMinimal class="h-10 w-10 text-base-content/40" />
							</div>
						{/if}

						<div class="absolute inset-x-0 top-0 flex items-center justify-between p-3">
							<span class="badge gap-1 border-none text-white shadow-sm badge-error">
								<Radio class="h-3 w-3 fill-current" />
								LIVE
							</span>
							{#if (stream.viewerCount ?? 0) > 0}
								<span class="badge gap-1 border-none bg-black/65 text-white backdrop-blur-sm">
									<Eye class="h-3.5 w-3.5" />
									{formatViewerCount(stream.viewerCount)}
								</span>
							{/if}
						</div>

						<div
							class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/45 to-transparent p-3"
						>
							<h2 class="truncate text-sm font-bold text-white">
								{stream.title || 'Untitled livestream'}
							</h2>
							{#if stream.description}
								<p class="mt-0.5 max-h-8 overflow-hidden text-xs leading-4 text-white/80">
									{stream.description}
								</p>
							{/if}
							{#if getPublisherName(stream.publisher)}
								<div class="mt-2 flex items-center gap-2">
									{#if stream.publisher?.picture?.id}
										<img
											src={getFileUrl(stream.publisher.picture.id) ?? ''}
											alt={getPublisherName(stream.publisher) ?? 'Publisher'}
											class="h-6 w-6 rounded-full object-cover ring ring-white/30"
											loading="lazy"
										/>
									{:else}
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white ring ring-white/30"
										>
											{getPublisherInitial(getPublisherName(stream.publisher))}
										</div>
									{/if}
									<span class="truncate text-xs font-medium text-white/90">
										{getPublisherName(stream.publisher)}
									</span>
								</div>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
