<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { PageData } from './$types';
	import { getFileUrl } from '$lib/utils/files';
	import { API_BASE_URL } from '$lib/utils/api';
	import { Crown } from 'lucide-svelte';
	import type { ChatMessage } from '$lib/types/livestream';
	import type { Account } from '$lib/types/post';

	let { data }: { data: PageData } = $props();

	const MAX_MESSAGES = 500;

	let messages: ChatMessage[] = $state([]);
	let chatContainer: HTMLDivElement | null = $state(null);
	let credentials: { url: string; token: string } | null = $state(null);
	let animatedMessageIds: Set<string> = $state(new Set());
	const accountLookupCache = new Map<string, Promise<Account | null>>();
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

	function parseNumber(input: unknown): number {
		if (typeof input === 'number') return input;
		if (typeof input === 'string') return Number.parseFloat(input) || 0;
		return 0;
	}

	function parseInteger(input: unknown): number {
		if (typeof input === 'number') return Math.trunc(input);
		if (typeof input === 'string') return Number.parseInt(input, 10) || 0;
		return 0;
	}

	function parseDateIso(input: unknown): string | null {
		if (typeof input !== 'string' || !input.trim()) return null;
		const date = new Date(input);
		if (Number.isNaN(date.getTime())) return null;
		return date.toISOString();
	}

	function createdTimestamp(input: ChatMessage): number {
		const ts = input.createdAt ? Date.parse(input.createdAt) : Number.NaN;
		if (!Number.isFinite(ts)) return 0;
		return ts;
	}

	function extractObjectList(payload: unknown): Record<string, unknown>[] {
		if (Array.isArray(payload)) {
			return payload.filter(
				(item): item is Record<string, unknown> => item !== null && typeof item === 'object'
			);
		}
		if (payload && typeof payload === 'object') {
			const holder = payload as Record<string, unknown>;
			const candidates = [holder.data, holder.items, holder.results, holder.list];
			for (const candidate of candidates) {
				if (Array.isArray(candidate)) {
					return candidate.filter(
						(item): item is Record<string, unknown> => item !== null && typeof item === 'object'
					);
				}
			}
		}
		return [];
	}

	function pictureIdFromSender(rawSender: unknown): string | null {
		if (!rawSender || typeof rawSender !== 'object') return null;
		const senderObj = rawSender as Record<string, unknown>;
		const profile = senderObj.profile;
		if (!profile || typeof profile !== 'object') return null;
		const picture = (profile as Record<string, unknown>).picture;
		if (!picture || typeof picture !== 'object') return null;
		const id = (picture as Record<string, unknown>).id;
		return typeof id === 'string' && id ? id : null;
	}

	function accountFromUnknown(raw: unknown): Account | null {
		if (!raw || typeof raw !== 'object') return null;
		const obj = raw as Record<string, unknown>;
		const id = typeof obj.id === 'string' ? obj.id : '';
		const name = typeof obj.name === 'string' ? obj.name : '';
		if (!id && !name) return null;
		const nick = typeof obj.nick === 'string' ? obj.nick : name || null;
		const profile =
			obj.profile && typeof obj.profile === 'object' ? (obj.profile as Account['profile']) : null;
		return {
			id: id || name,
			name: name || id,
			nick,
			profile
		};
	}

	function authHeadersForLookup(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};
		if (typeof window === 'undefined') return headers;
		const urlToken = new URLSearchParams(window.location.search).get('tk');
		const localToken = localStorage.getItem('auth_token');
		const token = urlToken || localToken;
		if (token) headers.Authorization = `Bearer ${token}`;
		return headers;
	}

	async function fetchAccountByRef(ref: string): Promise<Account | null> {
		const key = ref.trim();
		if (!key) return null;
		if (accountLookupCache.has(key)) {
			return accountLookupCache.get(key)!;
		}
		const lookupPromise = (async () => {
			try {
				const res = await fetch(`${API_BASE_URL}/pass/accounts/${encodeURIComponent(key)}`, {
					headers: authHeadersForLookup()
				});
				if (!res.ok) return null;
				const payload = await res.json();
				const payloadObj = payload as Record<string, unknown>;
				return (
					accountFromUnknown(payloadObj.data) ||
					accountFromUnknown(payloadObj.account) ||
					accountFromUnknown(payloadObj)
				);
			} catch {
				return null;
			}
		})();
		accountLookupCache.set(key, lookupPromise);
		return lookupPromise;
	}

	async function resolveSenderAccount(
		senderId: string,
		senderName: string
	): Promise<Account | null> {
		if (senderId.trim()) {
			const byId = await fetchAccountByRef(senderId);
			if (byId) return byId;
		}
		if (senderName.trim()) {
			const byName = await fetchAccountByRef(senderName);
			if (byName) return byName;
		}
		return null;
	}

	function chatMessageFromActiveAward(award: Record<string, unknown>): ChatMessage | null {
		const rawSender = award.sender ?? award.account;
		const senderId = String(award.sender_id ?? award.account_id ?? '').trim();
		const senderName = String(
			award.sender_name ||
				(rawSender &&
				typeof rawSender === 'object' &&
				typeof (rawSender as Record<string, unknown>).name === 'string'
					? (rawSender as Record<string, unknown>).name
					: null) ||
				award.sender ||
				'Unknown'
		).trim();

		const amount = parseNumber(award.amount);
		if (amount <= 0) return null;

		const message = typeof award.message === 'string' ? award.message : '';
		const createdAt = parseDateIso(award.created_at) || new Date().toISOString();
		const expiresAt = parseDateIso(award.expires_at);

		let highlightSeconds = parseInteger(award.highlight_seconds);
		if (highlightSeconds <= 0 && expiresAt) {
			const computed = Math.floor((Date.parse(expiresAt) - Date.parse(createdAt)) / 1000) || 0;
			highlightSeconds = computed > 0 ? computed : 0;
		}
		if (highlightSeconds <= 0 && !expiresAt) {
			highlightSeconds = 120;
		}

		const pictureId = pictureIdFromSender(rawSender);
		const metadata: Record<string, unknown> = { amount, highlightSeconds };
		if (expiresAt) metadata.activeUntil = expiresAt;
		if (pictureId) metadata.pictureId = pictureId;

		return {
			id: `active-award-${String(award.id || crypto.randomUUID())}`,
			senderId,
			sender: {
				id: senderId,
				name: senderName,
				nick: senderName,
				profile: null
			},
			senderName,
			message,
			isMine: false,
			createdAt,
			messageType: 'systemAward',
			metadata
		};
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
			const [chatRes, activeAwardsRes] = await Promise.all([
				fetch(`${API_BASE_URL}/sphere/livestreams/${livestreamId}/chat?limit=100&offset=0`, {
					headers
				}),
				fetch(`${API_BASE_URL}/sphere/livestreams/${livestreamId}/awards/active`, { headers })
			]);

			const history: ChatMessage[] = [];
			if (chatRes.ok) {
				const chatMessages = await chatRes.json();
				const mapped = extractObjectList(chatMessages)
					.map((msg) => {
						const pictureId =
							typeof msg.picture_id === 'string' ? msg.picture_id : pictureIdFromSender(msg.sender);
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
							messageType: 'chat' as const,
							metadata: pictureId ? { pictureId } : null
						} satisfies ChatMessage;
					})
					.reverse();
				history.push(...mapped);
			}

			if (activeAwardsRes.ok) {
				const activeAwardsPayload = await activeAwardsRes.json();
				const activeAwards = extractObjectList(activeAwardsPayload);
				for (const award of activeAwards) {
					const msg = chatMessageFromActiveAward(award);
					if (msg) history.push(msg);
				}
			}

			history.sort((a, b) => createdTimestamp(a) - createdTimestamp(b));
			messages = [...messages, ...history];
			if (messages.length > MAX_MESSAGES) {
				messages = messages.slice(-MAX_MESSAGES);
			}
			scrollToBottom();
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

	function awardTier(msg: ChatMessage): 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'teal' {
		const amount = readAmount(msg);
		if (amount >= 500) return 'red';
		if (amount >= 200) return 'orange';
		if (amount >= 100) return 'amber';
		if (amount >= 50) return 'green';
		if (amount >= 20) return 'blue';
		return 'teal';
	}

	function awardTierClass(msg: ChatMessage): string {
		return `message-item-award-${awardTier(msg)}`;
	}

	function senderLabel(msg: ChatMessage): string {
		return msg.sender.nick?.trim() || msg.senderName?.trim() || 'Unknown';
	}

	function senderInitial(msg: ChatMessage): string {
		const name = senderLabel(msg).trim();
		if (!name) return '?';
		return name[0].toUpperCase();
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
			void (async () => {
				try {
					const decoder = new TextDecoder('utf-8');
					const jsonStr = decoder.decode(payload);
					if (!jsonStr.trim()) return;

					const parsed = JSON.parse(jsonStr);
					const senderFromPayload = accountFromUnknown(parsed.sender);
					let senderId = String(parsed.sender_id || senderFromPayload?.id || '');
					let sender = String(
						parsed.sender_name ||
							senderFromPayload?.nick ||
							senderFromPayload?.name ||
							parsed.user ||
							parsed.from ||
							'未知'
					);
					const content = String(parsed.content || parsed.message || parsed.msg || '');
					const amount = parsed.amount;
					let pictureId = parsed.sender?.profile?.picture?.id || parsed.picture_id;
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
						const needsLookup = !senderFromPayload || !pictureId;
						const resolvedAccount = needsLookup
							? await resolveSenderAccount(senderId, sender)
							: null;
						if (resolvedAccount) {
							senderId = senderId || resolvedAccount.id;
							sender = resolvedAccount.nick?.trim() || resolvedAccount.name || sender;
							pictureId = pictureId || resolvedAccount.profile?.picture?.id;
							if (pictureId && !isAwardEvent) {
								metadata.pictureId = pictureId;
							}
						}
						const chatMsg: ChatMessage = {
							id: crypto.randomUUID(),
							senderId,
							sender: resolvedAccount ||
								senderFromPayload || {
									id: senderId,
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
			})();
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
	class="chat-panel chat-scroll absolute inset-0 w-full overflow-y-auto px-2 py-2"
	style={embedStyleVars()}
>
	{#each messages as message (message.id)}
		{#if isSuperchatMessage(message)}
			<div
				class={`message-item message-item-award ${awardTierClass(message)} mb-1 rounded-lg px-2 py-1 text-sm`}
				class:message-enter={animatedMessageIds.has(message.id)}
			>
				<div class="award-head">
					<div class="award-avatar" aria-hidden="true">
						{#if getAvatarPictureId(message)}
							<img
								src={getFileUrl(getAvatarPictureId(message))}
								alt={`${senderLabel(message)} avatar`}
								class="h-full w-full rounded-full object-cover"
							/>
						{:else}
							<span>{senderInitial(message)}</span>
						{/if}
					</div>
					<div class="award-main">
						<div class="message-meta flex items-center gap-1 font-semibold">
							<span>{senderLabel(message)}</span>
							<Crown class="h-3 w-3" />
						</div>
						<div class="award-amount">{readAmount(message)} pts</div>
					</div>
				</div>
				{#if message.message.trim()}
					<div class="award-body message-text">{message.message}</div>
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

	.chat-scroll {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.chat-scroll::-webkit-scrollbar {
		display: none;
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
		--award-name-color: #ffffff;
		--award-message-color: #ffffff;
		--award-head-bg: rgba(15, 118, 110, 0.96);
		--award-body-bg: rgba(94, 234, 212, 0.72);
		--award-body-text: #0f172a;
		padding: 0;
		overflow: hidden;
		border-color: rgba(255, 255, 255, 0.28);
	}

	.message-item-award .message-meta {
		color: var(--award-name-color);
	}

	.message-item-award .message-text {
		color: var(--award-message-color);
	}

	.award-head {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: calc(var(--embed-card-py) + 2px) var(--embed-card-px);
		background: var(--award-head-bg);
	}

	.award-main {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 0;
	}

	.award-avatar {
		width: var(--embed-avatar-size);
		height: var(--embed-avatar-size);
		border-radius: 9999px;
		display: grid;
		place-items: center;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.22);
		color: #ffffff;
		font-size: calc(var(--embed-meta-font-size) + 1px);
		font-weight: 700;
		flex-shrink: 0;
	}

	.award-amount {
		color: #ffffff;
		font-weight: 800;
		font-size: var(--embed-font-size);
		line-height: 1.25;
	}

	.award-body {
		padding: var(--embed-card-py) var(--embed-card-px);
		background: var(--award-body-bg);
		color: var(--award-body-text);
	}

	.message-item-award-red {
		--award-head-bg: rgba(185, 28, 28, 0.96);
		--award-body-bg: rgba(248, 113, 113, 0.78);
		--award-body-text: #ffffff;
		background: linear-gradient(140deg, rgba(185, 28, 28, 0.94), rgba(239, 68, 68, 0.82));
	}

	.message-item-award-orange {
		--award-message-color: #0c0a09;
		--award-head-bg: rgba(194, 65, 12, 0.96);
		--award-body-bg: rgba(251, 146, 60, 0.78);
		--award-body-text: #0c0a09;
		background: linear-gradient(140deg, rgba(194, 65, 12, 0.94), rgba(251, 146, 60, 0.84));
	}

	.message-item-award-amber {
		--award-message-color: #0c0a09;
		--award-head-bg: rgba(180, 83, 9, 0.96);
		--award-body-bg: rgba(251, 191, 36, 0.78);
		--award-body-text: #0c0a09;
		background: linear-gradient(140deg, rgba(180, 83, 9, 0.94), rgba(251, 191, 36, 0.84));
	}

	.message-item-award-green {
		--award-head-bg: rgba(21, 128, 61, 0.96);
		--award-body-bg: rgba(74, 222, 128, 0.78);
		--award-body-text: #052e16;
		background: linear-gradient(140deg, rgba(21, 128, 61, 0.94), rgba(34, 197, 94, 0.84));
	}

	.message-item-award-blue {
		--award-head-bg: rgba(29, 78, 216, 0.96);
		--award-body-bg: rgba(96, 165, 250, 0.78);
		--award-body-text: #082f49;
		background: linear-gradient(140deg, rgba(29, 78, 216, 0.94), rgba(59, 130, 246, 0.84));
	}

	.message-item-award-teal {
		--award-message-color: #0f172a;
		--award-head-bg: rgba(15, 118, 110, 0.96);
		--award-body-bg: rgba(94, 234, 212, 0.72);
		--award-body-text: #0f172a;
		background: linear-gradient(140deg, rgba(13, 148, 136, 0.94), rgba(94, 234, 212, 0.82));
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
