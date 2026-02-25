import { writable, type Writable } from 'svelte/store';
import { apiClient } from '$lib/utils/api';
import type { ChatMessage, LivestreamCredentials } from '$lib/types/livestream';
import { parseLivestreamEventPayload } from '$lib/utils/livestream/chat';
import type { Account } from '$lib/types/post';

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

export interface LivestreamRoomState {
	isConnecting: boolean;
	isConnected: boolean;
	playbackBlocked: boolean;
	errorText: string | null;
	viewerCount: number;
	volume: number;
	messages: ChatMessage[];
}

const initialState: LivestreamRoomState = {
	isConnecting: false,
	isConnected: false,
	playbackBlocked: false,
	errorText: null,
	viewerCount: 0,
	volume: 1,
	messages: []
};

const sdkScriptUrl = 'https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js';

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

export class LivekitRoomController {
	public readonly state: Writable<LivestreamRoomState> = writable(initialState);

	private room: LivekitRoom | null = null;
	private livekitEvents: Record<string, unknown> | null = null;
	private mediaContainer: HTMLDivElement | null = null;
	private attachedMedia = new Set<HTMLMediaElement>();
	private handlers: Record<string, ((...args: unknown[]) => void) | null> = {
		onTrackSubscribed: null,
		onTrackUnsubscribed: null,
		onDisconnected: null,
		onParticipantConnected: null,
		onParticipantDisconnected: null,
		onDataReceived: null,
		onAudioPlaybackStatusChanged: null
	};

	constructor(private readonly identityFallback = 'viewer') {}

	public async fetchChatHistory(livestreamId: string, limit = 50, offset = 0) {
		try {
			const response = await apiClient(
				`/sphere/livestreams/${encodeURIComponent(livestreamId)}/chat?limit=${limit}&offset=${offset}`
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch chat history: ${response.status}`);
			}

			const chatMessages = await response.json();

			// Convert API response to ChatMessage format
			const messages: ChatMessage[] = chatMessages
				.map((msg: unknown) => {
					if (typeof msg !== 'object' || msg === null) return null;
					const message = msg as Record<string, unknown>;
					return {
						id: String(message.id || ''),
						senderId: String(message.sender_id || ''),
						sender: message.sender as Account,
						senderName: String(message.sender_name || ''),
						message: String(message.content || ''),
						isMine: false, // Assume these are not from the current user
						createdAt: String(message.created_at || ''),
						messageType: 'chat' as const
					};
				})
				.filter((msg: unknown): msg is ChatMessage => msg !== null)
				.reverse();

			this.state.update((s) => ({ ...s, messages }));
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to fetch chat history.';
			this.state.update((s) => ({ ...s, errorText: message }));
		}
	}

	public setMediaContainer(container: HTMLDivElement | null) {
		this.mediaContainer = container;
	}

	public setVolume(volume: number) {
		for (const media of this.attachedMedia) media.volume = volume;
		this.state.update((s) => ({ ...s, volume }));
	}

	public async connect(credentials: LivestreamCredentials) {
		let isBusy = false;
		const unsubscribe = this.state.subscribe((s) => {
			isBusy = s.isConnecting || s.isConnected;
		});
		unsubscribe();
		if (isBusy) return;

		this.state.update((s) => ({ ...s, isConnecting: true, errorText: null }));
		try {
			const livekit = await ensureLivekitSdk();
			const RoomCtor = livekit.Room as
				| (new (options?: Record<string, unknown>) => LivekitRoom)
				| undefined;
			if (!RoomCtor) throw new Error('LiveKit Room class is unavailable.');

			const nextRoom = new RoomCtor({ adaptiveStream: true, dynacast: true });
			nextRoom.prepareConnection?.(credentials.url, credentials.token);
			this.registerRoomEvents(livekit, nextRoom);
			try {
				await nextRoom.connect(credentials.url, credentials.token, {
					autoSubscribe: true,
					maxRetries: 1,
					websocketTimeout: 15000,
					peerConnectionTimeout: 15000,
					rtcConfig: { iceTransportPolicy: 'all' }
				});
			} catch {
				await nextRoom.connect(credentials.url, credentials.token, {
					autoSubscribe: true,
					maxRetries: 0,
					websocketTimeout: 20000,
					peerConnectionTimeout: 20000,
					rtcConfig: { iceTransportPolicy: 'relay' }
				});
			}

			this.room = nextRoom;
			this.state.update((s) => ({
				...s,
				isConnecting: false,
				isConnected: true,
				playbackBlocked: nextRoom.canPlaybackAudio === false,
				viewerCount: nextRoom.remoteParticipants.size
			}));
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to connect livestream.';
			this.state.update((s) => ({
				...s,
				isConnecting: false,
				errorText: `${message} (ICE/TURN path may be blocked. Check TURN over TLS/443.)`
			}));
		}
	}

	public async disconnect() {
		if (!this.room) return;
		this.unregisterRoomEvents(this.room);
		try {
			await this.room.disconnect();
		} catch {
			// ignore
		}
		this.room = null;
		this.clearMedia();
		this.state.update((s) => ({
			...s,
			isConnected: false,
			playbackBlocked: false,
			viewerCount: 0
		}));
	}

	public async startAudio() {
		if (!this.room?.startAudio) return;
		try {
			await this.room.startAudio();
			this.state.update((s) => ({ ...s, playbackBlocked: false }));
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to start audio playback.';
			this.state.update((s) => ({ ...s, errorText: message }));
		}
	}

	public async sendMessage(text: string, livestreamId: string) {
		const messageText = text.trim();
		if (!messageText || !this.room) return;
		try {
			// Send message via the new API endpoint
			const response = await apiClient(
				`/sphere/livestreams/${encodeURIComponent(livestreamId)}/chat`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						content: messageText
					})
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to send message: ${response.status}`);
			}

			const responseData = await response.json();

			// Create the message from the API response
			const mine: ChatMessage = {
				id: responseData.id,
				senderId: responseData.sender_id,
				sender: responseData.sender_name,
				senderName: responseData.sender_name,
				message: responseData.content,
				isMine: true,
				createdAt: responseData.created_at,
				messageType: 'chat'
			};

			this.state.update((s) => ({ ...s, messages: [...s.messages, mine].slice(-200) }));
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to send chat message.';
			this.state.update((s) => ({ ...s, errorText: message }));
		}
	}

	public async destroy() {
		await this.disconnect();
		this.state.set(initialState);
	}

	private clearMedia() {
		for (const media of this.attachedMedia) {
			try {
				media.pause();
				media.remove();
			} catch {
				// ignore
			}
		}
		this.attachedMedia.clear();
	}

	private registerRoomEvents(livekit: Record<string, unknown>, targetRoom: LivekitRoom) {
		this.livekitEvents = (livekit.RoomEvent ?? {}) as Record<string, unknown>;
		const trackKind = (livekit.Track as { Kind?: Record<string, string> } | undefined)?.Kind;

		this.handlers.onTrackSubscribed = (track: unknown) => {
			if (!track || typeof track !== 'object') return;
			const candidate = track as { kind?: string; attach?: () => HTMLMediaElement };
			if (!candidate.attach) return;
			const media = candidate.attach();
			media.autoplay = true;
			media.setAttribute('playsinline', 'true');

			let currentVolume = 1;
			this.state.update((s) => {
				currentVolume = s.volume;
				return s;
			});
			media.volume = currentVolume;

			if (candidate.kind === trackKind?.Video) {
				if (this.mediaContainer) this.mediaContainer.innerHTML = '';
				media.classList.add('h-full', 'w-full', 'object-cover');
				this.mediaContainer?.appendChild(media);
			} else if (candidate.kind === trackKind?.Audio) {
				media.style.display = 'none';
				this.mediaContainer?.appendChild(media);
			}
			this.attachedMedia.add(media);
		};

		this.handlers.onTrackUnsubscribed = (track: unknown) => {
			if (!track || typeof track !== 'object') return;
			const candidate = track as { detach?: () => HTMLMediaElement[] | void };
			if (!candidate.detach) return;
			const detached = candidate.detach();
			if (Array.isArray(detached)) {
				for (const media of detached) {
					this.attachedMedia.delete(media);
					media.remove();
				}
			}
		};

		this.handlers.onDisconnected = () => {
			this.clearMedia();
			this.state.update((s) => ({
				...s,
				isConnected: false,
				playbackBlocked: false,
				viewerCount: 0
			}));
		};

		this.handlers.onParticipantConnected = () =>
			this.state.update((s) => ({ ...s, viewerCount: targetRoom.remoteParticipants.size }));
		this.handlers.onParticipantDisconnected = () =>
			this.state.update((s) => ({ ...s, viewerCount: targetRoom.remoteParticipants.size }));

		this.handlers.onDataReceived = (payload: unknown, participant: unknown) => {
			if (!(payload instanceof Uint8Array)) return;
			try {
				const text = new TextDecoder().decode(payload);
				const identity =
					(participant &&
						typeof participant === 'object' &&
						'identity' in participant &&
						typeof (participant as { identity?: unknown }).identity === 'string' &&
						(participant as { identity: string }).identity) ||
					this.identityFallback;
				const message = parseLivestreamEventPayload(text, String(identity));
				if (!message) return;
				this.state.update((s) => ({ ...s, messages: [...s.messages, message].slice(-200) }));
			} catch {
				// ignore
			}
		};

		this.handlers.onAudioPlaybackStatusChanged = () => {
			this.state.update((s) => ({ ...s, playbackBlocked: targetRoom.canPlaybackAudio === false }));
		};

		const events = this.livekitEvents ?? {};
		if (!events || Object.keys(events).length === 0) return;
		targetRoom.on(events.TrackSubscribed, this.handlers.onTrackSubscribed!);
		targetRoom.on(events.TrackUnsubscribed, this.handlers.onTrackUnsubscribed!);
		targetRoom.on(events.Disconnected, this.handlers.onDisconnected!);
		targetRoom.on(events.ParticipantConnected, this.handlers.onParticipantConnected!);
		targetRoom.on(events.ParticipantDisconnected, this.handlers.onParticipantDisconnected!);
		targetRoom.on(events.DataReceived, this.handlers.onDataReceived!);
		targetRoom.on(events.AudioPlaybackStatusChanged, this.handlers.onAudioPlaybackStatusChanged!);
	}

	private unregisterRoomEvents(targetRoom: LivekitRoom | null) {
		if (!targetRoom || !targetRoom.off || !this.livekitEvents) return;
		if (this.handlers.onTrackSubscribed)
			targetRoom.off(this.livekitEvents.TrackSubscribed, this.handlers.onTrackSubscribed);
		if (this.handlers.onTrackUnsubscribed)
			targetRoom.off(this.livekitEvents.TrackUnsubscribed, this.handlers.onTrackUnsubscribed);
		if (this.handlers.onDisconnected)
			targetRoom.off(this.livekitEvents.Disconnected, this.handlers.onDisconnected);
		if (this.handlers.onParticipantConnected)
			targetRoom.off(this.livekitEvents.ParticipantConnected, this.handlers.onParticipantConnected);
		if (this.handlers.onParticipantDisconnected)
			targetRoom.off(
				this.livekitEvents.ParticipantDisconnected,
				this.handlers.onParticipantDisconnected
			);
		if (this.handlers.onDataReceived)
			targetRoom.off(this.livekitEvents.DataReceived, this.handlers.onDataReceived);
		if (this.handlers.onAudioPlaybackStatusChanged)
			targetRoom.off(
				this.livekitEvents.AudioPlaybackStatusChanged,
				this.handlers.onAudioPlaybackStatusChanged
			);
	}
}
