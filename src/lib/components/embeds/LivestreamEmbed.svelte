<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import { apiClient } from '$lib/utils/api';
import { getFileUrl } from '$lib/utils/files';
import { snakeToCamel } from '$lib/utils/case';
	import {
		Play,
		Square,
		Expand,
		Volume2,
		Users,
		MessageCircle,
		Send,
		ChevronDown,
		ChevronUp,
		Loader2,
		ExternalLink
	} from 'lucide-svelte';

	interface Props {
		livestreamId: string;
		embed?: Record<string, unknown>;
		isInteractive?: boolean;
		showChat?: boolean;
	}

	type LivestreamDetail = {
		id?: string;
		title?: string;
		description?: string;
		status?: string | number;
		thumbnail?: { id?: string } | null;
		thumbnail_id?: string | null;
	};

	type Credentials = {
		serverUrl: string;
		participantToken: string;
	};

	type ChatMessage = {
		id: string;
		name: string;
		text: string;
		at: Date;
	};

	type LivekitRoom = {
		connect: (url: string, token: string, options?: Record<string, unknown>) => Promise<void>;
		disconnect: () => Promise<void> | void;
		prepareConnection?: (url: string, token: string) => void;
		canPlaybackAudio?: boolean;
		startAudio?: () => Promise<void>;
		remoteParticipants: Map<string, unknown>;
		localParticipant: {
			publishData: (data: Uint8Array, options?: { reliable?: boolean }) => Promise<void>;
		};
		on: (event: unknown, handler: (...args: unknown[]) => void) => LivekitRoom;
		off?: (event: unknown, handler: (...args: unknown[]) => void) => LivekitRoom;
	};

	let { livestreamId, embed = {}, isInteractive = true, showChat = true }: Props = $props();

	let detail = $state<LivestreamDetail | null>(null);
	let loadingDetail = $state(true);
	let detailError = $state<string | null>(null);

	let room = $state<LivekitRoom | null>(null);
	let livekitEvents = $state<Record<string, unknown> | null>(null);
	let isConnecting = $state(false);
	let isConnected = $state(false);
	let playbackBlocked = $state(false);
	let errorText = $state<string | null>(null);
	let viewerCount = $state(0);
	let volume = $state(1);
	let chatCollapsed = $state(false);
	let chatInput = $state('');
	let messages = $state<ChatMessage[]>([]);

	let playerShell: HTMLDivElement | null = null;
	let mediaContainer: HTMLDivElement | null = null;

	const attachedMedia = new Set<HTMLMediaElement>();
	const sdkScriptUrl = 'https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js';

	const eventHandlers: Record<string, ((...args: unknown[]) => void) | null> = {
		onTrackSubscribed: null,
		onTrackUnsubscribed: null,
		onDisconnected: null,
		onParticipantConnected: null,
		onParticipantDisconnected: null,
		onDataReceived: null,
		onAudioPlaybackStatusChanged: null
	};

	function pickString(source: unknown, keys: string[]): string | null {
		if (!source || typeof source !== 'object') return null;
		const input = source as Record<string, unknown>;
		for (const key of keys) {
			const value = input[key];
			if (typeof value === 'string' && value.trim() !== '') return value;
		}
		return null;
	}

	function addMessage(name: string, text: string) {
		if (!text.trim()) return;
		const next: ChatMessage = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			name,
			text: text.trim(),
			at: new Date()
		};
		messages = [...messages, next].slice(-150);
	}

	function halt(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
	}

	function isStreamActive(status: string | number | undefined): boolean {
		if (typeof status === 'number') return status === 1;
		if (typeof status === 'string') return status.toLowerCase() === 'active';
		return true;
	}

	async function fetchDetail() {
		loadingDetail = true;
		detailError = null;
		try {
			const resp = await apiClient(`/sphere/livestreams/${encodeURIComponent(livestreamId)}`);
			const raw = (await resp.json()) as unknown;
			const data = snakeToCamel<LivestreamDetail>(raw);
			detail = data;
		} catch (err) {
			detailError = err instanceof Error ? err.message : 'Failed to load livestream.';
		} finally {
			loadingDetail = false;
		}
	}

	async function ensureLivekitSdk(): Promise<Record<string, unknown>> {
		if (typeof window === 'undefined') throw new Error('LiveKit requires a browser environment.');
		const win = window as Window & { LivekitClient?: Record<string, unknown> };
		if (win.LivekitClient) return win.LivekitClient;

		await new Promise<void>((resolve, reject) => {
			const existing = document.querySelector(
				`script[data-livekit-sdk="true"]`
			) as HTMLScriptElement | null;
			if (existing) {
				if ((window as Window & { LivekitClient?: unknown }).LivekitClient) {
					resolve();
					return;
				}
				existing.addEventListener('load', () => resolve(), { once: true });
				existing.addEventListener('error', () => reject(new Error('Failed to load LiveKit SDK.')), {
					once: true
				});
				return;
			}

			const script = document.createElement('script');
			script.src = sdkScriptUrl;
			script.async = true;
			script.defer = true;
			script.dataset.livekitSdk = 'true';
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load LiveKit SDK.'));
			document.head.appendChild(script);
		});

		if (!win.LivekitClient) throw new Error('LiveKit SDK is unavailable after script load.');
		return win.LivekitClient;
	}

	async function fetchCredentials(): Promise<Credentials> {
		const embeddedUrl = pickString(embed, ['serverUrl', 'server_url', 'wsUrl', 'ws_url', 'url']);
		const embeddedToken = pickString(embed, ['participantToken', 'participant_token', 'token']);
		if (embeddedUrl && embeddedToken) {
			return { serverUrl: embeddedUrl, participantToken: embeddedToken };
		}

		try {
			const resp = await apiClient(`/sphere/livestreams/${livestreamId}/token`, { method: 'GET' });
			const raw = (await resp.json()) as unknown;
			const payload = snakeToCamel<Record<string, unknown>>(raw);
			const serverUrl = pickString(payload, [
				'serverUrl',
				'server_url',
				'wsUrl',
				'ws_url',
				'endpoint',
				'url'
			]);
			const participantToken = pickString(payload, [
				'participantToken',
				'participant_token',
				'token',
				'access_token'
			]);
			if (serverUrl && participantToken) {
				return { serverUrl, participantToken };
			}
		} catch {
			// try next candidate
		}

		throw new Error('Unable to retrieve livestream credentials.');
	}

	function clearAttachedMedia() {
		for (const element of attachedMedia) {
			try {
				element.pause();
				element.remove();
			} catch {
				// no-op
			}
		}
		attachedMedia.clear();
	}

	function applyVolume(level: number) {
		for (const element of attachedMedia) {
			element.volume = level;
		}
	}

	function syncViewerCount() {
		viewerCount = room ? room.remoteParticipants.size : 0;
	}

	function registerRoomEvents(livekit: Record<string, unknown>, targetRoom: LivekitRoom) {
		livekitEvents = (livekit.RoomEvent ?? {}) as Record<string, unknown>;
		const trackKind = (livekit.Track as { Kind?: Record<string, string> } | undefined)?.Kind;

		eventHandlers.onTrackSubscribed = (track: unknown) => {
			if (!track || typeof track !== 'object') return;
			const candidate = track as {
				kind?: string;
				attach?: () => HTMLMediaElement;
			};
			if (!candidate.attach) return;
			const media = candidate.attach();
			media.autoplay = true;
			media.setAttribute('playsinline', 'true');
			media.volume = volume;

			if (candidate.kind === trackKind?.Video) {
				if (mediaContainer) mediaContainer.innerHTML = '';
				media.classList.add('h-full', 'w-full', 'object-cover');
				mediaContainer?.appendChild(media);
			} else if (candidate.kind === trackKind?.Audio) {
				media.style.display = 'none';
				mediaContainer?.appendChild(media);
			}
			attachedMedia.add(media);
		};

		eventHandlers.onTrackUnsubscribed = (track: unknown) => {
			if (!track || typeof track !== 'object') return;
			const candidate = track as { detach?: () => HTMLMediaElement[] | void };
			if (!candidate.detach) return;
			const detached = candidate.detach();
			if (Array.isArray(detached)) {
				for (const media of detached) {
					attachedMedia.delete(media);
					media.remove();
				}
			}
		};

		eventHandlers.onDisconnected = () => {
			isConnected = false;
			playbackBlocked = false;
			syncViewerCount();
			clearAttachedMedia();
		};

		eventHandlers.onParticipantConnected = () => syncViewerCount();
		eventHandlers.onParticipantDisconnected = () => syncViewerCount();

		eventHandlers.onDataReceived = (payload: unknown, participant: unknown) => {
			if (!(payload instanceof Uint8Array)) return;
			try {
				const text = new TextDecoder().decode(payload);
				const name =
					(participant &&
						typeof participant === 'object' &&
						'identity' in participant &&
						typeof (participant as { identity?: unknown }).identity === 'string' &&
						(participant as { identity: string }).identity) ||
					'viewer';
				addMessage(String(name), text);
			} catch {
				// ignore malformed payloads
			}
		};

		eventHandlers.onAudioPlaybackStatusChanged = () => {
			playbackBlocked = targetRoom.canPlaybackAudio === false;
		};

		const events = livekitEvents ?? {};
		if (!events || Object.keys(events).length === 0) return;

		targetRoom.on(events.TrackSubscribed, eventHandlers.onTrackSubscribed!);
		targetRoom.on(events.TrackUnsubscribed, eventHandlers.onTrackUnsubscribed!);
		targetRoom.on(events.Disconnected, eventHandlers.onDisconnected!);
		targetRoom.on(events.ParticipantConnected, eventHandlers.onParticipantConnected!);
		targetRoom.on(events.ParticipantDisconnected, eventHandlers.onParticipantDisconnected!);
		targetRoom.on(events.DataReceived, eventHandlers.onDataReceived!);
		targetRoom.on(events.AudioPlaybackStatusChanged, eventHandlers.onAudioPlaybackStatusChanged!);
	}

	function unregisterRoomEvents(targetRoom: LivekitRoom | null) {
		if (!targetRoom || !targetRoom.off || !livekitEvents) return;
		if (eventHandlers.onTrackSubscribed)
			targetRoom.off(livekitEvents.TrackSubscribed, eventHandlers.onTrackSubscribed);
		if (eventHandlers.onTrackUnsubscribed)
			targetRoom.off(livekitEvents.TrackUnsubscribed, eventHandlers.onTrackUnsubscribed);
		if (eventHandlers.onDisconnected)
			targetRoom.off(livekitEvents.Disconnected, eventHandlers.onDisconnected);
		if (eventHandlers.onParticipantConnected)
			targetRoom.off(livekitEvents.ParticipantConnected, eventHandlers.onParticipantConnected);
		if (eventHandlers.onParticipantDisconnected)
			targetRoom.off(
				livekitEvents.ParticipantDisconnected,
				eventHandlers.onParticipantDisconnected
			);
		if (eventHandlers.onDataReceived)
			targetRoom.off(livekitEvents.DataReceived, eventHandlers.onDataReceived);
		if (eventHandlers.onAudioPlaybackStatusChanged)
			targetRoom.off(
				livekitEvents.AudioPlaybackStatusChanged,
				eventHandlers.onAudioPlaybackStatusChanged
			);
	}

	async function connectRoom() {
		if (!isInteractive || isConnecting || isConnected) return;
		isConnecting = true;
		errorText = null;
		try {
			const [livekit, creds] = await Promise.all([ensureLivekitSdk(), fetchCredentials()]);
			const RoomCtor = livekit.Room as
				| (new (options?: Record<string, unknown>) => LivekitRoom)
				| undefined;
			if (!RoomCtor) throw new Error('LiveKit Room class is unavailable.');

			const nextRoom = new RoomCtor({
				adaptiveStream: true,
				dynacast: true
			});
			nextRoom.prepareConnection?.(creds.serverUrl, creds.participantToken);
			registerRoomEvents(livekit, nextRoom);
			try {
				await nextRoom.connect(creds.serverUrl, creds.participantToken, {
					autoSubscribe: true,
					maxRetries: 1,
					websocketTimeout: 15000,
					peerConnectionTimeout: 15000,
					rtcConfig: { iceTransportPolicy: 'all' }
				});
			} catch (firstError) {
				// Fallback for restrictive networks: force TURN relay once.
				await nextRoom.connect(creds.serverUrl, creds.participantToken, {
					autoSubscribe: true,
					maxRetries: 0,
					websocketTimeout: 20000,
					peerConnectionTimeout: 20000,
					rtcConfig: { iceTransportPolicy: 'relay' }
				});
				console.warn('LiveKit initial connect failed; relay fallback succeeded.', firstError);
			}
			room = nextRoom;
			isConnected = true;
			syncViewerCount();
			playbackBlocked = nextRoom.canPlaybackAudio === false;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to connect livestream.';
			errorText = `${message} (ICE/TURN path may be blocked. Check TURN over TLS/443.)`;
		} finally {
			isConnecting = false;
		}
	}

	async function disconnectRoom() {
		if (!room) return;
		unregisterRoomEvents(room);
		try {
			await room.disconnect();
		} catch {
			// ignore disconnect errors
		}
		room = null;
		isConnected = false;
		playbackBlocked = false;
		syncViewerCount();
		clearAttachedMedia();
	}

	async function requestFullscreen() {
		if (!playerShell) return;
		await playerShell.requestFullscreen?.();
	}

	async function resumeAudio() {
		if (!room?.startAudio) return;
		try {
			await room.startAudio();
			playbackBlocked = false;
		} catch (err) {
			errorText = err instanceof Error ? err.message : 'Unable to start audio playback.';
		}
	}

	async function sendMessage() {
		const text = chatInput.trim();
		if (!text || !room) return;
		try {
			await room.localParticipant.publishData(new TextEncoder().encode(text), { reliable: true });
			addMessage('you', text);
			chatInput = '';
		} catch (err) {
			errorText = err instanceof Error ? err.message : 'Failed to send chat message.';
		}
	}

	$effect(() => {
		applyVolume(volume);
	});

	onMount(() => {
		void fetchDetail();
	});

	onDestroy(() => {
		void disconnectRoom();
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
			{#if isConnected}
				<div class="badge badge-outline badge-sm">
					<Users class="h-3.5 w-3.5" />
					{viewerCount}
				</div>
			{/if}
		</div>

		<div bind:this={playerShell} class="relative aspect-video overflow-hidden rounded-xl bg-black">
			{#if !isConnected}
				{#if detail?.thumbnail?.id || detail?.thumbnail_id}
					<img
						src={getFileUrl(detail?.thumbnail?.id ?? detail?.thumbnail_id ?? undefined)}
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

			{#if isInteractive && !isConnected}
				<div class="absolute inset-0 flex items-center justify-center">
					<button
						type="button"
						class="btn btn-sm btn-primary"
						onclick={(e) => {
							halt(e);
							void connectRoom();
						}}
						disabled={isConnecting || !isStreamActive(detail?.status)}
					>
						{#if isConnecting}
							<Loader2 class="h-4 w-4 animate-spin" />
						{:else}
							<Play class="h-4 w-4" />
						{/if}
						Watch
					</button>
				</div>
			{/if}

			{#if isConnected}
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
							void disconnectRoom();
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

		{#if errorText}
			<div class="mt-2 alert py-2 text-sm alert-error">{errorText}</div>
		{/if}

		{#if isConnected}
			<div class="mt-2 flex items-center gap-2">
				<Volume2 class="h-4 w-4 text-base-content/70" />
				<input
					type="range"
					min="0"
					max="2"
					step="0.05"
					bind:value={volume}
					class="range w-full range-primary range-xs"
				/>
				<span class="w-10 text-right text-xs text-base-content/70">{Math.round(volume * 100)}%</span
				>
			</div>

			{#if playbackBlocked}
				<div class="mt-2">
					<button
						type="button"
						class="btn btn-outline btn-sm"
						onclick={(e) => {
							halt(e);
							void resumeAudio();
						}}
					>
						Enable audio
					</button>
				</div>
			{/if}

			{#if showChat}
				<div class="mt-3 rounded-xl border border-base-300 bg-base-200/25">
					<button
						type="button"
						class="flex w-full items-center gap-2 px-3 py-2 text-left"
						onclick={(e) => {
							halt(e);
							chatCollapsed = !chatCollapsed;
						}}
					>
						<MessageCircle class="h-4 w-4" />
						<span class="text-sm font-medium">Live chat ({messages.length})</span>
						<span class="ml-auto">
							{#if chatCollapsed}
								<ChevronDown class="h-4 w-4" />
							{:else}
								<ChevronUp class="h-4 w-4" />
							{/if}
						</span>
					</button>
					{#if !chatCollapsed}
						<div class="max-h-56 space-y-2 overflow-y-auto px-3 pb-2">
							{#if messages.length === 0}
								<div class="py-4 text-center text-xs text-base-content/60">
									No chat messages yet.
								</div>
							{:else}
								{#each messages as message (message.id)}
									<div class="rounded-lg bg-base-100 px-2 py-1.5 text-sm">
										<div class="text-xs text-base-content/60">{message.name}</div>
										<div>{message.text}</div>
									</div>
								{/each}
							{/if}
						</div>
						<div class="border-t border-base-300 p-2">
							<div class="flex items-center gap-2">
								<input
									type="text"
									class="input input-sm w-full"
									placeholder="Send a message..."
									bind:value={chatInput}
									onkeydown={(e) => {
										e.stopPropagation();
										if (e.key === 'Enter') {
											e.preventDefault();
											void sendMessage();
										}
									}}
								/>
								<button
									type="button"
									class="btn btn-sm btn-primary"
									onclick={(e) => {
										halt(e);
										void sendMessage();
									}}
									disabled={!chatInput.trim()}
								>
									<Send class="h-4 w-4" />
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>
