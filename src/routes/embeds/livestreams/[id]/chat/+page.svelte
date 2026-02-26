<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { getFileUrl } from '$lib/utils/files';
	import { API_BASE_URL } from '$lib/utils/api';

	let { data }: { data: PageData } = $props();

	let danmuContainer: HTMLDivElement | undefined = $state();
	let manager: unknown = $state();
	let credentials: { url: string; token: string } | null = $state(null);

	const danmuScriptUrl = 'https://unpkg.com/danmu/dist/danmu.umd.js';
	const livekitScriptUrl =
		'https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js';

	async function ensureScripts() {
		const win = window as Window & { Danmu?: unknown; LivekitClient?: unknown };
		if (win.Danmu && win.LivekitClient) return;

		await Promise.all([
			new Promise<void>((resolve, reject) => {
				if (win.Danmu) {
					resolve();
					return;
				}
				const existing = document.querySelector(`script[data-danmu="true"]`);
				if (existing) {
					if (win.Danmu) {
						resolve();
						return;
					}
					existing.addEventListener('load', () => resolve(), { once: true });
					existing.addEventListener('error', () => reject(new Error('Failed to load Danmu')), {
						once: true
					});
					return;
				}
				const script = document.createElement('script');
				script.src = danmuScriptUrl;
				script.dataset.danmu = 'true';
				script.onload = () => resolve();
				script.onerror = () => reject(new Error('Failed to load Danmu'));
				document.head.appendChild(script);
			}),
			new Promise<void>((resolve, reject) => {
				if (win.LivekitClient) {
					resolve();
					return;
				}
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
			})
		]);
	}

	function createDanmuManager() {
		const win = window as Window & { Danmu?: Record<string, unknown> };
		if (!win.Danmu || !danmuContainer) return;

		manager = (
			win.Danmu as { create: (options: Record<string, unknown>) => Record<string, unknown> }
		).create({
			trackHeight: '25%',
			plugin: {
				$createNode(danmaku: { data: unknown; node?: HTMLSpanElement }) {
					const danmakuData = danmaku.data;
					let text = '';
					let imgUrl: string | null = null;

					if (typeof danmakuData === 'string') {
						text = danmakuData;
					} else if (danmakuData && typeof danmakuData === 'object') {
						const obj = danmakuData as Record<string, unknown>;
						text = String(obj.text || '');
						imgUrl = obj.img ? String(obj.img) : null;
					}

					const node = document.createElement('span');
					node.style.color = 'white';
					node.style.fontSize = '28px';
					node.style.fontWeight = 'bold';
					node.style.textShadow = '2px 2px 4px black';
					node.style.whiteSpace = 'nowrap';
					node.style.position = 'absolute';
					node.style.display = 'inline-block';

					if (imgUrl) {
						const img = document.createElement('img');
						img.src = imgUrl;
						img.style.width = '1.2em';
						img.style.height = '1.2em';
						img.style.objectFit = 'cover';
						img.style.verticalAlign = 'middle';
						img.style.marginRight = '4px';
						img.style.borderRadius = '50%';
						img.style.display = 'inline-block';
						img.alt = '';
						node.appendChild(img);
					}

					if (text) {
						const textSpan = document.createElement('span');
						textSpan.style.display = 'inline-block';
						textSpan.style.verticalAlign = 'middle';
						textSpan.textContent = text;
						node.appendChild(textSpan);
					}

					danmaku.node = node;
				}
			}
		});

		(manager as { mount: (el: HTMLElement) => void }).mount(danmuContainer);
		(manager as { startPlaying: () => void }).startPlaying();
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

				if (amount) {
					const message = parsed.message || '';
					let text = `${sender} 打赏了 ${amount}`;
					if (message) text += ` 并说：${message}`;
					(manager as { unshift: (text: string) => void }).unshift(text);
				} else if (content && pictureId) {
					const imgUrl = getFileUrl(pictureId) ?? '';
					(manager as { unshift: (data: { text: string; img: string }) => void }).unshift({
						text: content,
						img: imgUrl
					});
				} else if (content) {
					(manager as { unshift: (text: string) => void }).unshift(content);
				}
			} catch (err) {
				console.error('Parse message failed', err);
			}
		});

		room.on('participantConnected', (...args: unknown[]) => {
			const participant = args[0] as { name?: string };
			(manager as { unshift: (text: string) => void }).unshift(
				`${participant.name || 'Someone'} 加入了直播间`
			);
		});

		room.on('participantDisconnected', (...args: unknown[]) => {
			const participant = args[0] as { name?: string };
			(manager as { unshift: (text: string) => void }).unshift(
				`${participant.name || 'Someone'} 离开了直播间`
			);
		});

		try {
			await room.connect(credentials!.url, credentials!.token);
		} catch (err) {
			console.error('LiveKit connection failed:', err);
			(manager as { unshift: (text: string) => void }).unshift('⚠️ 连接失败');
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
			createDanmuManager();

			const livestreamId = data.livestream?.id;
			if (!livestreamId) {
				(manager as { unshift: (text: string) => void })?.unshift('⚠️ 缺少直播ID');
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
				(manager as { unshift: (text: string) => void })?.unshift('⚠️ 无法获取连接凭证');
				return;
			}

			if (credentials) {
				await connectLivekit();
			} else {
				(manager as { unshift: (text: string) => void })?.unshift('⚠️ 无法获取连接凭证');
			}
		} catch (err) {
			console.error('Initialization failed:', err);
		}
	});
</script>

<svelte:head>
	<title>Damuku Embed | {data.livestream?.title ?? 'Livestream'}</title>
</svelte:head>

<div
	bind:this={danmuContainer}
	class="danmu-container relative h-full w-full overflow-hidden"
></div>
