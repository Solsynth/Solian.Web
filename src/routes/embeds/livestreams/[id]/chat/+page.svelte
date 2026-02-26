<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { slide } from 'svelte/transition';
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

	const livekitScriptUrl =
		'https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js';

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

	function addMessage(msg: ChatMessage) {
		messages = [...messages, msg];
		if (messages.length > MAX_MESSAGES) {
			messages = messages.slice(-MAX_MESSAGES);
		}
		requestAnimationFrame(() => scrollToBottom());
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
				const content = parsed.content || parsed.message || parsed.msg;
				const amount = parsed.amount;
				const pictureId = parsed.sender?.profile?.picture?.id || parsed.picture_id;

				if (content || amount) {
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
						message: content || '',
						isMine: false,
						createdAt: new Date().toISOString(),
						messageType: amount ? 'systemAward' : 'chat',
						metadata: amount ? { amount } : pictureId ? { pictureId } : null
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

		if (accessToken) {
			console.log('[EMBED CHAT] Using access token from URL');
		}

		try {
			await ensureScripts();

			const livestreamId = data.livestream?.id;

			await loadChatHistory(livestreamId!, accessToken);
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

<div bind:this={chatContainer} class="chat-panel absolute inset-0 w-full overflow-y-auto px-2 py-2">
	{#each messages as message (message.id)}
		{#if isSuperchatMessage(message)}
			<div
				class="mb-1 rounded-lg border border-warning/30 bg-warning/15 px-2 py-1 text-sm"
				in:slide={{ duration: 200, axis: 'y' }}
			>
				<div class="flex items-center gap-1 text-xs font-semibold text-warning">
					<Crown class="h-3 w-3" />
					<span>{senderLabel(message)} 打赏了 {readAmount(message)}</span>
				</div>
				{#if message.message.trim()}
					<div class="text-sm">{message.message}</div>
				{/if}
			</div>
		{:else if message.messageType === 'systemJoin' || message.messageType === 'systemLeave'}
			<div
				class="mb-1 text-center text-xs text-base-content/55"
				in:slide={{ duration: 200, axis: 'y' }}
			>
				{message.message}
			</div>
		{:else}
			<div
				class="mb-1 rounded-lg bg-base-100/60 px-2 py-1 text-sm backdrop-blur-sm"
				in:slide={{ duration: 200, axis: 'y' }}
			>
				<div class="flex gap-2">
					<div class="avatar h-6 w-6 shrink-0">
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
						<div class="text-xs text-base-content/60">
							<span class="font-medium">{senderLabel(message)}</span>
							<span> • {formatMessageTime(message.createdAt)}</span>
						</div>
						<div class="wrap-break-word">{message.message}</div>
					</div>
				</div>
			</div>
		{/if}
	{/each}
</div>
