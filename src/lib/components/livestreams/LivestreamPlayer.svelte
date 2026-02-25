<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { getFileUrl } from '$lib/utils/files';
	import {
		Play,
		Square,
		Expand,
		Volume2,
		Users,
		Loader2,
		ExternalLink,
		Trophy,
		Crown
	} from 'lucide-svelte';
	import {
		fetchLivestreamCredentials,
		fetchLivestreamDetail
	} from '$lib/services/livestream/livestream-api';
	import { LivekitRoomController } from '$lib/services/livestream/livekit-room';
	import type { LivestreamDetail } from '$lib/types/livestream';
	import { latestActiveSuperchat } from '$lib/utils/livestream/chat';
	import LivestreamChatPanel from '$lib/components/livestreams/LivestreamChatPanel.svelte';
	import LivestreamLeaderboardModal from '$lib/components/livestreams/LivestreamLeaderboardModal.svelte';

	interface Props {
		livestreamId: string;
		embed?: Record<string, unknown>;
		isInteractive?: boolean;
		showChat?: boolean;
		roomController?: LivekitRoomController;
	}

	let {
		livestreamId,
		embed = {},
		isInteractive = true,
		showChat = true,
		roomController: externalRoomController
	}: Props = $props();

	let detail = $state<LivestreamDetail | null>(null);
	let loadingDetail = $state(true);
	let detailError = $state<string | null>(null);
	let leaderboardOpen = $state(false);
	let chatCollapsed = $state(false);
	let playerShell: HTMLDivElement | null = null;
	let mediaContainer: HTMLDivElement | null = null;

	const internalRoomController = new LivekitRoomController('viewer');
	const roomController = $derived(externalRoomController ?? internalRoomController);
	const roomState = $derived(roomController.state);

	let room = $derived($roomState);
	let activeSuperchat = $derived(latestActiveSuperchat(room.messages));

	function halt(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
	}

	function isStreamActive(status: string | number | undefined): boolean {
		if (typeof status === 'number') return status === 1;
		if (typeof status === 'string') return status.toLowerCase() === 'active';
		return true;
	}

	async function loadDetail() {
		loadingDetail = true;
		detailError = null;
		try {
			detail = await fetchLivestreamDetail(livestreamId);
		} catch (err) {
			detailError = err instanceof Error ? err.message : 'Failed to load livestream.';
		} finally {
			loadingDetail = false;
		}
	}

	async function connect() {
		try {
			const credentials = await fetchLivestreamCredentials(livestreamId);
			await roomController.connect(credentials);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to get livestream credentials.';
			roomState.update((s) => ({ ...s, errorText: message }));
		}
	}

	async function disconnect() {
		await roomController.disconnect();
	}

	async function requestFullscreen() {
		if (!playerShell) return;
		await playerShell.requestFullscreen?.();
	}

	onMount(() => {
		roomController.setMediaContainer(mediaContainer);
		void loadDetail();
	});

	$effect(() => {
		roomController.setMediaContainer(mediaContainer);
	});

	onDestroy(() => {
		if (externalRoomController) return;
		void internalRoomController.destroy();
	});
</script>

<div class="card border border-base-300 bg-base-100">
	<div class="card-body p-3">
		<div class="mb-2 flex items-start justify-between gap-3">
			<div class="min-w-0">
				<div class="line-clamp-1 text-sm font-semibold">
					{detail?.title ?? 'Untitled livestream'}
				</div>
				{#if detail?.description}
					<div class="line-clamp-2 text-xs text-base-content/70">{detail.description}</div>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				{#if room.isConnected}
					<div class="badge badge-outline badge-sm">
						<Users class="h-3.5 w-3.5" />
						{room.viewerCount}
					</div>
				{/if}
				<button
					type="button"
					class="btn btn-circle btn-ghost btn-xs"
					onclick={(e) => {
						halt(e);
						leaderboardOpen = true;
					}}
				>
					<Trophy class="h-4 w-4 text-warning" />
				</button>
			</div>
		</div>

		<div bind:this={playerShell} class="relative aspect-video overflow-hidden rounded-xl bg-black">
			{#if !room.isConnected}
				{#if detail?.thumbnail?.id || detail?.thumbnailId}
					<img
						src={getFileUrl(detail?.thumbnail?.id ?? detail?.thumbnailId ?? undefined)}
						alt={detail?.title ?? 'Livestream preview'}
						class="h-full w-full object-cover"
						loading="lazy"
					/>
				{:else}
					<div class="h-full w-full bg-black"></div>
				{/if}
				<div class="absolute inset-0 bg-black/40"></div>
			{/if}

			<div bind:this={mediaContainer} class="absolute inset-0"></div>

			{#if activeSuperchat}
				<div
					class="absolute top-2 left-2 rounded-full border border-warning/40 bg-warning/20 px-2 py-1 text-xs font-semibold text-warning"
				>
					<Crown class="mr-1 inline h-3.5 w-3.5" />
					{activeSuperchat.sender} donated
				</div>
			{/if}

			{#if isInteractive && !room.isConnected}
				<div class="absolute inset-0 flex items-center justify-center">
					<button
						type="button"
						class="btn btn-sm btn-primary"
						onclick={(e) => {
							halt(e);
							void connect();
						}}
						disabled={room.isConnecting || !isStreamActive(detail?.status)}
					>
						{#if room.isConnecting}
							<Loader2 class="h-4 w-4 animate-spin" />
						{:else}
							<Play class="h-4 w-4" />
						{/if}
						Watch
					</button>
				</div>
			{/if}

			{#if room.isConnected}
				<div class="absolute top-2 right-2 flex items-center gap-2">
					<button
						type="button"
						class="btn btn-circle bg-base-100/80 btn-ghost btn-xs"
						onclick={(e) => {
							halt(e);
							void requestFullscreen();
						}}
					>
						<Expand class="h-4 w-4" />
					</button>
					<button
						type="button"
						class="btn btn-circle bg-base-100/80 btn-ghost btn-xs"
						onclick={(e) => {
							halt(e);
							window.open(`/livestreams/${livestreamId}`, '_blank');
						}}
					>
						<ExternalLink class="h-4 w-4" />
					</button>
					<button
						type="button"
						class="btn btn-xs btn-error"
						onclick={(e) => {
							halt(e);
							void disconnect();
						}}
					>
						<Square class="h-3.5 w-3.5" /> Leave
					</button>
				</div>
			{/if}
		</div>

		{#if loadingDetail}
			<div class="mt-2 flex items-center gap-2 text-xs text-base-content/60">
				<Loader2 class="h-3.5 w-3.5 animate-spin" /> Loading stream info...
			</div>
		{:else if detailError}
			<div class="mt-2 alert py-2 text-sm alert-warning">{detailError}</div>
		{/if}

		{#if room.errorText}
			<div class="mt-2 alert py-2 text-sm alert-error">{room.errorText}</div>
		{/if}

		{#if room.isConnected}
			<div class="mt-2 flex items-center gap-2">
				<Volume2 class="h-4 w-4 text-base-content/70" />
				<input
					type="range"
					min="0"
					max="2"
					step="0.05"
					value={room.volume}
					oninput={(e) => {
						e.stopPropagation();
						const next = Number((e.currentTarget as HTMLInputElement).value);
						roomController.setVolume(next);
					}}
					class="range w-full range-primary range-xs"
				/>
				<span class="w-10 text-right text-xs text-base-content/70"
					>{Math.round(room.volume * 100)}%</span
				>
			</div>

			{#if room.playbackBlocked}
				<div class="mt-2">
					<button
						type="button"
						class="btn btn-outline btn-sm"
						onclick={(e) => {
							halt(e);
							void roomController.startAudio();
						}}
					>
						Enable audio
					</button>
				</div>
			{/if}

			{#if showChat}
				<LivestreamChatPanel
					messages={room.messages}
					collapsed={chatCollapsed}
					onToggleCollapse={() => (chatCollapsed = !chatCollapsed)}
					onSend={async (value) => roomController.sendMessage(value, livestreamId)}
				/>
			{/if}
		{/if}
	</div>
</div>

<LivestreamLeaderboardModal
	open={leaderboardOpen}
	{livestreamId}
	onClose={() => {
		leaderboardOpen = false;
	}}
/>
