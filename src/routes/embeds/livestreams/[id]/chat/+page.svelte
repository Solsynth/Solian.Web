<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { PageData } from './$types';
	import { getFileUrl } from '$lib/utils/files';
	import { API_BASE_URL } from '$lib/utils/api';
	import { Crown } from 'lucide-svelte';
	import type { ChatMessage } from '$lib/types/livestream';

	let { data }: { data: PageData } = $props();

	const MAX_MESSAGES = 500;

	let messages: ChatMessage[] = $state([]);
	let chatContainer: HTMLDivElement | null = $state(null);
	let credentials: { url: string; token: string } | null = $state(null);
	let animatedMessageIds: Set<string> = $state(new Set());
	let embedUi = $state({
		scale: 1.42,
		fontSizePx: 14,
		metaFontSizePx: 12,
		avatarPx: 28,
		panelPaddingPx: 10,
		cardPaddingX: 10,
		cardPaddingY: 8,
		itemGapPx: 6,
		radiusPx: 12
	});

	const livekitScriptUrl =
		'https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js';
	const joinEventTypes = new Set(['participant_joined', 'user_joined', 'joined', 'join']);
	const leaveEventTypes = new Set(['participant_left', 'user_left', 'left', 'leave', 'disconnect']);
	const awardEventTypes = new Set([
		'stream_awarded',
		'stream_award',
		'awarded',
		'award',
		'gift',
		'tip'
	]);
	const infoEventLabels: Record<string, string> = {
		stream_started: '直播开始',
		stream_ended: '直播结束',
		pinned: '置顶消息',
		unpinned: '取消置顶',
		follow: '关注',
		share: '分享',
		like: '点赞',
		timeout: '超时',
		muted: '禁言',
		banned: '封禁',
		warning: '提醒',
		error: '错误',
		announcement: '公告'
	};

	async function ensureScripts() {
		const win = window as Window & { LivekitClient?: unknown };
		if (win.LivekitClient) return;

		await new Promise<void>((resolve, reject) => {
			const existing = document.querySelector(`script[data-livekit-sdk="true"]`);
			if (existing) {
				if (win.LivekitClient) {
					resolve();
					return;
				}
				existing.addEventListener('load', () => resolve(), { once: true });
				existing.addEventListener('error', () => reject(new Error('Failed to load LiveKit')), {
					once: true
				});
				return;
			}
			const script = document.createElement('script');
			script.src = livekitScriptUrl;
			script.dataset.livekitSdk = 'true';
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load LiveKit'));
			document.head.appendChild(script);
		});
	}

	function markMessageForEntryAnimation(messageId: string) {
		animatedMessageIds = new Set(animatedMessageIds).add(messageId);
		window.setTimeout(() => {
			const nextIds = new Set(animatedMessageIds);
			nextIds.delete(messageId);
			animatedMessageIds = nextIds;
		}, 420);
	}

	function addMessage(msg: ChatMessage, animate = true) {
		messages = [...messages, msg];
		if (messages.length > MAX_MESSAGES) {
			messages = messages.slice(-MAX_MESSAGES);
		}
		if (animate) {
			markMessageForEntryAnimation(msg.id);
		}
		requestAnimationFrame(() => scrollToBottom());
	}

	function readNumberParam(
		params: URLSearchParams,
		key: string,
		fallback: number,
		min: number,
		max: number
	): number {
		const raw = params.get(key);
		if (!raw) return fallback;
		const parsed = Number.parseFloat(raw);
		if (!Number.isFinite(parsed)) return fallback;
		return Math.min(max, Math.max(min, parsed));
	}

	function applyEmbedUiProps(params: URLSearchParams) {
		const preset = (params.get('size') || '').toLowerCase();
		const presetScaleMap: Record<string, number> = {
			sm: 0.95,
			md: 1.25,
			lg: 1.42,
			xl: 1.6
		};
		const presetScale = presetScaleMap[preset] ?? 1.42;
		const scale = readNumberParam(params, 'scale', presetScale, 0.75, 2.2);
		const fontSizePx = readNumberParam(params, 'font', Math.round(12 * scale), 10, 30);
		const avatarPx = readNumberParam(params, 'avatar', Math.round(24 * scale), 16, 72);
		const panelPaddingPx = readNumberParam(params, 'padding', Math.round(8 * scale), 2, 32);
		const radiusPx = readNumberParam(params, 'radius', Math.round(10 * scale), 4, 32);
		const cardPaddingX = readNumberParam(params, 'cardX', Math.round(8 * scale), 4, 32);
		const cardPaddingY = readNumberParam(params, 'cardY', Math.round(6 * scale), 2, 24);
		const itemGapPx = readNumberParam(params, 'gap', Math.max(4, Math.round(5 * scale)), 2, 24);

		embedUi = {
			scale,
			fontSizePx,
			metaFontSizePx: Math.max(10, Math.round(fontSizePx * 0.84)),
			avatarPx,
			panelPaddingPx,
			cardPaddingX,
			cardPaddingY,
			itemGapPx,
			radiusPx
		};
	}

	function embedStyleVars() {
		return [
			`--embed-font-size:${embedUi.fontSizePx}px`,
			`--embed-meta-font-size:${embedUi.metaFontSizePx}px`,
			`--embed-avatar-size:${embedUi.avatarPx}px`,
			`--embed-panel-padding:${embedUi.panelPaddingPx}px`,
			`--embed-card-px:${embedUi.cardPaddingX}px`,
			`--embed-card-py:${embedUi.cardPaddingY}px`,
			`--embed-item-gap:${embedUi.itemGapPx}px`,
			`--embed-radius:${embedUi.radiusPx}px`
		].join(';');
	}

	function normalizeEventType(rawType: unknown): string {
		if (typeof rawType !== 'string') return '';
		return rawType.trim().toLowerCase().replaceAll('-', '_');
	}

	function toDisplayEventLabel(normalizedEventType: string): string {
		if (!normalizedEventType) return '系统消息';
		return infoEventLabels[normalizedEventType] || normalizedEventType.replaceAll('_', ' ');
	}

	function toSystemInfoMessage(
		sender: string,
		normalizedEventType: string,
		content: string
	): string {
		if (content.trim()) return content;
		const label = toDisplayEventLabel(normalizedEventType);
		return sender ? `${sender} · ${label}` : label;
	}

	async function loadChatHistory(livestreamId: string, accessToken?: string | null) {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};
		if (accessToken) {
			headers['Authorization'] = `Bearer ${accessToken}`;
		} else {
			const localToken = localStorage.getItem('auth_token');
			if (localToken) {
				headers['Authorization'] = `Bearer ${localToken}`;
			}
		}

		try {
			const res = await fetch(
				`${API_BASE_URL}/sphere/livestreams/${livestreamId}/chat?limit=100&offset=0`,
				{ headers }
			);
			if (res.ok) {
				const chatMessages = await res.json();
				const history: ChatMessage[] = chatMessages
					.map((msg: Record<string, unknown>) => {
						const pictureId = msg.picture_id as string | undefined;
						return {
							id: String(msg.id || ''),
							senderId: String(msg.sender_id || ''),
							sender: (msg.sender as { id: string; name: string; nick: string; profile: null }) || {
								id: String(msg.sender_id || ''),
								name: String(msg.sender_name || ''),
								nick: String(msg.sender_name || ''),
								profile: null
							},
							senderName: String(msg.sender_name || ''),
							message: String(msg.content || ''),
							isMine: false,
							createdAt: String(msg.created_at || ''),
							messageType: 'chat',
							metadata: pictureId ? { pictureId } : null
						};
					})
					.reverse();
				messages = [...messages, ...history];
				if (messages.length > MAX_MESSAGES) {
					messages = messages.slice(-MAX_MESSAGES);
				}
				scrollToBottom();
			}
		} catch (err) {
			console.error('Failed to load chat history:', err);
		}
	}

	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	function isSuperchatMessage(msg: ChatMessage): boolean {
		const amount = msg.metadata?.amount;
		if (!amount) return false;
		if (typeof amount === 'number') return amount > 0;
		if (typeof amount === 'string') return Number.parseFloat(amount) > 0;
		return false;
	}

	function readAmount(msg: ChatMessage): number {
		const raw = msg.metadata?.amount;
		if (typeof raw === 'number') return raw;
		if (typeof raw === 'string') return Number.parseFloat(raw) || 0;
		return 0;
	}

	function senderLabel(msg: ChatMessage): string {
		return msg.sender.nick?.trim() || msg.senderName?.trim() || 'Unknown';
	}

	function messageEventLabel(msg: ChatMessage): string {
		const eventType = msg.metadata?.eventType;
		if (typeof eventType === 'string') {
			return toDisplayEventLabel(eventType);
		}
		if (msg.messageType === 'systemJoin') return '加入';
		if (msg.messageType === 'systemLeave') return '离开';
		return '系统';
	}

	function formatMessageTime(isoString: string | null | undefined): string {
		if (!isoString) return '';
		const date = new Date(isoString);
		const now = new Date();
		const isSameDay =
			date.getFullYear() === now.getFullYear() &&
			date.getMonth() === now.getMonth() &&
			date.getDate() === now.getDate();

		const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		if (isSameDay) {
			return time;
		}
		const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
		return `${dateStr} ${time}`;
	}

	function getAvatarPictureId(msg: ChatMessage): string | null {
		const fromProfile = msg.sender.profile?.picture?.id;
		if (fromProfile) return fromProfile;
		const fromMetadata = msg.metadata?.pictureId;
		if (typeof fromMetadata === 'string') return fromMetadata;
		return null;
	}

	async function connectLivekit() {
		const win = window as Window & { LivekitClient?: Record<string, unknown> };
		if (!win.LivekitClient || !credentials) return;

		const LivekitClient = win.LivekitClient;
		type RoomType = {
			connect: (url: string, token: string, options?: Record<string, unknown>) => Promise<void>;
			on: (event: string, handler: (...args: unknown[]) => void) => RoomType;
			disconnect: () => Promise<void>;
			remoteParticipants: Map<string, unknown>;
		};
		const room = new (LivekitClient.Room as new (options?: Record<string, unknown>) => RoomType)({
			autoSubscribe: true
		});

		room.on('dataReceived', (...args: unknown[]) => {
			const payload = args[0] as Uint8Array;
			try {
				const decoder = new TextDecoder('utf-8');
				const jsonStr = decoder.decode(payload);
				if (!jsonStr.trim()) return;

				const parsed = JSON.parse(jsonStr);
				const sender = parsed.sender_name || parsed.user || parsed.from || '未知';
				const content = String(parsed.content || parsed.message || parsed.msg || '');
				const amount = parsed.amount;
				const pictureId = parsed.sender?.profile?.picture?.id || parsed.picture_id;
				const normalizedEventType = normalizeEventType(
					parsed.type || parsed.event || parsed.event_type
				);
				const isAwardEvent = awardEventTypes.has(normalizedEventType) || Number(amount) > 0;
				const isJoinEvent = joinEventTypes.has(normalizedEventType);
				const isLeaveEvent = leaveEventTypes.has(normalizedEventType);

				if (content || amount || normalizedEventType) {
					const messageType = isAwardEvent
						? 'systemAward'
						: isJoinEvent
							? 'systemJoin'
							: isLeaveEvent
								? 'systemLeave'
								: normalizedEventType
									? 'systemInfo'
									: 'chat';
					const metadata: Record<string, unknown> = {};
					if (typeof amount === 'number' || typeof amount === 'string') {
						metadata.amount = amount;
					}
					if (pictureId && !isAwardEvent) {
						metadata.pictureId = pictureId;
					}
					if (normalizedEventType) {
						metadata.eventType = normalizedEventType;
					}
					const chatMsg: ChatMessage = {
						id: crypto.randomUUID(),
						senderId: parsed.sender_id || '',
						sender: {
							id: parsed.sender_id || '',
							name: sender,
							nick: sender,
							profile: null
						},
						senderName: sender,
						message: isAwardEvent
							? content
							: isJoinEvent
								? `${sender} 加入了直播间`
								: isLeaveEvent
									? `${sender} 离开了直播间`
									: normalizedEventType
										? toSystemInfoMessage(sender, normalizedEventType, content)
										: content,
						isMine: false,
						createdAt: new Date().toISOString(),
						messageType,
						metadata: Object.keys(metadata).length > 0 ? metadata : null
					};
					addMessage(chatMsg);
				}
			} catch (err) {
				console.error('Parse message failed', err);
			}
		});

		room.on('participantConnected', (...args: unknown[]) => {
			const participant = args[0] as { identity?: string; name?: string };
			const chatMsg: ChatMessage = {
				id: crypto.randomUUID(),
				senderId: '',
				sender: { id: '', name: '', nick: '', profile: null },
				senderName: participant.name || participant.identity || 'Someone',
				message: `${participant.name || participant.identity || 'Someone'} 加入了直播间`,
				isMine: false,
				createdAt: new Date().toISOString(),
				messageType: 'systemJoin',
				metadata: null
			};
			addMessage(chatMsg);
		});

		room.on('participantDisconnected', (...args: unknown[]) => {
			const participant = args[0] as { identity?: string; name?: string };
			const chatMsg: ChatMessage = {
				id: crypto.randomUUID(),
				senderId: '',
				sender: { id: '', name: '', nick: '', profile: null },
				senderName: participant.name || participant.identity || 'Someone',
				message: `${participant.name || participant.identity || 'Someone'} 离开了直播间`,
				isMine: false,
				createdAt: new Date().toISOString(),
				messageType: 'systemLeave',
				metadata: null
			};
			addMessage(chatMsg);
		});

		try {
			await room.connect(credentials!.url, credentials!.token);
		} catch (err) {
			console.error('LiveKit connection failed:', err);
			const chatMsg: ChatMessage = {
				id: crypto.randomUUID(),
				senderId: '',
				sender: { id: '', name: '', nick: '', profile: null },
				senderName: 'System',
				message: '⚠️ 连接失败',
				isMine: false,
				createdAt: new Date().toISOString(),
				messageType: 'systemLeave',
				metadata: null
			};
			addMessage(chatMsg);
		}
	}

	onMount(async () => {
		if (typeof window === 'undefined') return;

		const urlParams = new URLSearchParams(window.location.search);
		const accessToken = urlParams.get('tk');
		applyEmbedUiProps(urlParams);

		if (accessToken) {
			console.log('[EMBED CHAT] Using access token from URL');
		}

		try {
			await ensureScripts();

			const livestreamId = data.livestream?.id;

			if (!livestreamId) {
				const chatMsg: ChatMessage = {
					id: crypto.randomUUID(),
					senderId: '',
					sender: { id: '', name: '', nick: '', profile: null },
					senderName: 'System',
					message: '⚠️ 缺少直播ID',
					isMine: false,
					createdAt: new Date().toISOString(),
					messageType: 'systemLeave',
					metadata: null
				};
				addMessage(chatMsg);
				return;
			}

			await loadChatHistory(livestreamId, accessToken);

			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};
			if (accessToken) {
				headers['Authorization'] = `Bearer ${accessToken}`;
			} else {
				const localToken = localStorage.getItem('auth_token');
				if (localToken) {
					headers['Authorization'] = `Bearer ${localToken}`;
				}
			}

			const credRes = await fetch(
				`${API_BASE_URL}/sphere/livestreams/${livestreamId}/token?tool=true`,
				{
					headers
				}
			);
			if (credRes.ok) {
				credentials = await credRes.json();
			} else {
				const errText = await credRes.text();
				console.error('[EMBED CHAT] Credentials error:', errText);
				const chatMsg: ChatMessage = {
					id: crypto.randomUUID(),
					senderId: '',
					sender: { id: '', name: '', nick: '', profile: null },
					senderName: 'System',
					message: '⚠️ 无法获取连接凭证',
					isMine: false,
					createdAt: new Date().toISOString(),
					messageType: 'systemLeave',
					metadata: null
				};
				addMessage(chatMsg);
				return;
			}

			if (credentials) {
				await connectLivekit();
			}
		} catch (err) {
			console.error('Initialization failed:', err);
		}
	});
</script>

<svelte:head>
	<title>Chat Embed | {data.livestream?.title ?? 'Livestream'}</title>
</svelte:head>

<div
	bind:this={chatContainer}
	class="chat-panel absolute inset-0 w-full overflow-y-auto px-2 py-2"
	style={embedStyleVars()}
>
	{#each messages as message (message.id)}
		{#if isSuperchatMessage(message)}
			<div
				class="message-item message-item-award mb-1 rounded-lg px-2 py-1 text-sm"
				class:message-enter={animatedMessageIds.has(message.id)}
			>
				<div class="message-meta flex items-center gap-1 font-semibold text-amber-200">
					<Crown class="h-3 w-3" />
					<span>{senderLabel(message)} 打赏了 {readAmount(message)}</span>
				</div>
				{#if message.message.trim()}
					<div class="message-text text-amber-50">{message.message}</div>
				{/if}
			</div>
		{:else if message.messageType === 'systemJoin' || message.messageType === 'systemLeave' || message.messageType === 'systemInfo'}
			<div
				class="message-item message-item-system mb-1 text-center text-xs"
				class:message-enter={animatedMessageIds.has(message.id)}
			>
				<span class="font-medium text-slate-50">{messageEventLabel(message)}</span>
				<span class="mx-1 text-slate-300">•</span>
				<span class="text-slate-200">{message.message}</span>
			</div>
		{:else}
			<div
				class="message-item message-item-chat mb-1 rounded-lg px-2 py-1 text-sm"
				class:message-enter={animatedMessageIds.has(message.id)}
			>
				<div class="flex gap-2">
					<div
						class="avatar shrink-0"
						style="width: var(--embed-avatar-size); height: var(--embed-avatar-size);"
					>
						<div class="h-full w-full rounded-full">
							{#if getAvatarPictureId(message)}
								<img
									src={getFileUrl(getAvatarPictureId(message))}
									alt={`${senderLabel(message)} avatar`}
								/>
							{/if}
						</div>
					</div>
					<div class="min-w-0">
						<div class="message-meta text-slate-300">
							<span class="font-semibold text-slate-100">{senderLabel(message)}</span>
							<span> • {formatMessageTime(message.createdAt)}</span>
						</div>
						<div class="message-text wrap-break-word text-slate-50">{message.message}</div>
					</div>
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.chat-panel {
		padding: var(--embed-panel-padding);
		gap: var(--embed-item-gap);
		background: transparent;
		backdrop-filter: none;
	}

	.message-item {
		font-size: var(--embed-font-size);
		padding: var(--embed-card-py) var(--embed-card-px);
		border-radius: var(--embed-radius);
		border: 1px solid transparent;
		box-shadow: 0 2px 10px rgba(2, 6, 23, 0.24);
	}

	.message-meta {
		font-size: var(--embed-meta-font-size);
	}

	.message-text {
		font-size: var(--embed-font-size);
		line-height: 1.4;
	}

	.message-item-chat {
		background: linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.8));
		border-color: rgba(148, 163, 184, 0.2);
	}

	.message-item-system {
		background: rgba(15, 23, 42, 0.66);
		border-color: rgba(148, 163, 184, 0.2);
	}

	.message-item-award {
		background: linear-gradient(140deg, rgba(120, 53, 15, 0.92), rgba(146, 64, 14, 0.8));
		border-color: rgba(251, 191, 36, 0.45);
	}

	.message-enter {
		animation: message-slide-in 0.42s cubic-bezier(0.2, 0.75, 0.2, 1);
		will-change: transform, opacity, filter;
	}

	@keyframes message-slide-in {
		from {
			opacity: 0;
			transform: translate3d(24px, 0, 0) scale(0.98);
			filter: blur(4px);
		}
		to {
			opacity: 1;
			transform: translate3d(0, 0, 0) scale(1);
			filter: blur(0);
		}
	}
</style>
