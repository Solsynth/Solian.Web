<script lang="ts">
	import { onMount } from 'svelte';
	import { Trophy, X, Loader2 } from 'lucide-svelte';
	import { getFileUrl } from '$lib/utils/files';
	import { fetchLivestreamLeaderboard } from '$lib/services/livestream/livestream-api';
	import type { LivestreamLeaderboardEntry } from '$lib/types/livestream';

	interface Props {
		open?: boolean;
		livestreamId: string;
		onClose?: () => void;
	}

	let { open = false, livestreamId, onClose }: Props = $props();

	let loading = $state(false);
	let entries = $state<LivestreamLeaderboardEntry[]>([]);
	let loadError = $state<string | null>(null);

	function rankTone(rank: number): string {
		if (rank === 1) return 'text-warning';
		if (rank === 2) return 'text-base-content/80';
		if (rank === 3) return 'text-amber-700';
		return 'text-base-content/60';
	}

	async function load() {
		loading = true;
		loadError = null;
		try {
			entries = await fetchLivestreamLeaderboard(livestreamId, 10);
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Failed to load leaderboard.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (open) void load();
	});

	$effect(() => {
		if (open) void load();
	});
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center"
		role="button"
		tabindex="0"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose?.();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onClose?.();
			}
		}}
	>
		<div
			class="w-full max-w-lg rounded-t-2xl border border-base-300 bg-base-100 p-4 sm:rounded-2xl"
		>
			<div class="mb-3 flex items-center gap-2">
				<Trophy class="h-5 w-5 text-warning" />
				<h3 class="text-lg font-semibold">Livestream Leaderboard</h3>
				<button type="button" class="btn btn-circle btn-ghost btn-sm ml-auto" onclick={onClose}>
					<X class="h-4 w-4" />
				</button>
			</div>

			{#if loading}
				<div class="flex items-center justify-center py-8 text-base-content/70">
					<Loader2 class="h-5 w-5 animate-spin" />
				</div>
			{:else if loadError}
				<div class="alert alert-error py-2 text-sm">{loadError}</div>
			{:else if entries.length === 0}
				<div class="py-8 text-center text-sm text-base-content/60">No awards yet.</div>
			{:else}
				<div class="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
					{#each entries as entry}
						<div class="rounded-xl border border-base-300 bg-base-200/20 p-3">
							<div class="flex items-center gap-3">
								<div class={`w-7 text-center text-sm font-bold ${rankTone(entry.rank)}`}>#{entry.rank}</div>
								{#if entry.account?.profile?.picture?.id}
									<img
										src={getFileUrl(entry.account.profile.picture.id)}
										alt={entry.senderName}
										class="h-9 w-9 rounded-full object-cover"
										loading="lazy"
									/>
								{:else}
									<div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold">
										{entry.senderName?.[0]?.toUpperCase() ?? '?'}
									</div>
								{/if}
								<div class="min-w-0 flex-1">
									<div class="truncate text-sm font-semibold">
										{entry.account?.nick || entry.senderName || 'Unknown'}
									</div>
									<div class="text-xs text-base-content/60">{entry.awardCount} awards</div>
								</div>
								<div class="text-sm font-bold text-primary">{entry.totalAmount.toFixed(0)} NSP</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
