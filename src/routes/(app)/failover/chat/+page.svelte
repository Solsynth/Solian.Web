<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { getFileUrl } from '$lib/utils/files';

	type ChatMode = 'checking' | 'up' | 'failover';

	interface ChatMessage {
		id: string;
		type: 'chat' | 'system';
		name: string;
		avatarUrl?: string;
		isOfficial?: boolean;
		text: string;
		createdAt: string;
	}

	interface ChatEnvelope {
		type: 'init' | 'message';
		history?: ChatMessage[];
		message?: ChatMessage;
	}

	interface ModeResponse {
		mode: 'up' | 'failover';
	}

	interface UsernamePermissionResponse {
		allowed: boolean;
		available: boolean;
		reason: 'available' | 'owned' | 'taken';
	}

	interface MarkdownToken {
		type: 'text' | 'bold' | 'italic' | 'code' | 'link';
		text: string;
		href?: string;
	}

	let mode = $state<ChatMode>('checking');
	let modeHint = $state('Checking primary server status...');
	let nickname = $state('');
	let avatarUrl = $state<string | undefined>(undefined);
	let identityLocked = $state(false);
	let adminPassword = $state('');

	let messageInput = $state('');
	let connected = $state(false);
	let connecting = $state(false);
	let error = $state<string | null>(null);
	let messages = $state<ChatMessage[]>([]);

	let socket: WebSocket | null = null;
	let messageViewport: HTMLDivElement | null = null;

	function initials(name: string): string {
		const value = name.trim();
		return value ? value.charAt(0).toUpperCase() : '?';
	}

	function parseMarkdownInline(line: string): MarkdownToken[] {
		const tokens: MarkdownToken[] = [];
		const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = pattern.exec(line)) !== null) {
			if (match.index > lastIndex) {
				tokens.push({ type: 'text', text: line.slice(lastIndex, match.index) });
			}

			if (match[2]) {
				tokens.push({ type: 'bold', text: match[2] });
			} else if (match[3]) {
				tokens.push({ type: 'italic', text: match[3] });
			} else if (match[4]) {
				tokens.push({ type: 'code', text: match[4] });
			} else if (match[5] && match[6]) {
				tokens.push({ type: 'link', text: match[5], href: match[6] });
			}

			lastIndex = match.index + match[0].length;
		}

		if (lastIndex < line.length) {
			tokens.push({ type: 'text', text: line.slice(lastIndex) });
		}

		if (tokens.length === 0) {
			tokens.push({ type: 'text', text: line });
		}

		return tokens;
	}

	function parseMarkdownLines(text: string): MarkdownToken[][] {
		return text.split('\n').map((line) => parseMarkdownInline(line));
	}

	function getAuthHeader(): string | null {
		if (typeof window === 'undefined') return null;
		const token = localStorage.getItem('auth_token');
		return token ? `Bearer ${token}` : null;
	}

	function getAuthToken(): string | null {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem('auth_token');
	}

	function applyCredentialIdentity() {
		if (!auth.user) return false;
		const resolvedName = auth.user.name || auth.user.nick;
		if (!resolvedName?.trim()) return false;

		nickname = resolvedName.trim();
		avatarUrl = getFileUrl(auth.user.profile?.picture?.id) ?? undefined;
		identityLocked = true;
		return true;
	}

	async function detectMode() {
		mode = 'checking';
		modeHint = 'Checking primary server status...';

		try {
			const mockDown =
				typeof window !== 'undefined' &&
				new URL(window.location.href).searchParams.get('mock_down') === '1';
			const modeUrl = mockDown ? '/api/failover/chat/mode?mock_down=1' : '/api/failover/chat/mode';

			const response = await fetch(modeUrl, {
				method: 'GET',
				cache: 'no-store'
			});
			const data = (await response.json()) as ModeResponse;

			if (response.ok && data.mode === 'up') {
				mode = 'up';
				modeHint = 'Primary API is online.';

				if (auth.isAuthenticated && !auth.user) {
					await auth.fetchUser();
				}

				if (!applyCredentialIdentity()) {
					identityLocked = false;
					modeHint = 'Primary API is online. Username must be available or owned by your account.';
				}
			} else {
				mode = 'failover';
				identityLocked = false;
				modeHint = 'Primary API is unavailable. Running failover mode.';
			}
		} catch {
			mode = 'failover';
			identityLocked = false;
			modeHint = 'Primary API is unavailable. Running failover mode.';
		}
	}

	async function verifyUsernamePermission(name: string): Promise<boolean> {
		const headers: Record<string, string> = {};
		const authHeader = getAuthHeader();
		if (authHeader) headers.Authorization = authHeader;

		const response = await fetch(`/api/failover/chat/username-permission?name=${encodeURIComponent(name)}`,
			{
				method: 'GET',
				headers
			}
		);

		if (!response.ok) {
			error = 'Unable to validate username right now.';
			return false;
		}

		const data = (await response.json()) as UsernamePermissionResponse;
		if (!data.allowed) {
			error = 'That username is not permitted. Use an available name or your own account name.';
			return false;
		}

		return true;
	}

	async function verifyFailoverAdminPassword(): Promise<boolean> {
		if (!adminPassword.trim()) {
			error = 'Admin password is required in failover mode.';
			return false;
		}

		const response = await fetch('/api/failover/chat/admin-auth', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ password: adminPassword })
		});

		if (!response.ok) {
			error =
				response.status === 503
					? 'Failover admin password is not configured on server.'
					: 'Invalid failover admin password.';
			return false;
		}

		return true;
	}

	async function connect() {
		if (mode === 'checking') {
			error = 'Please wait. Server status check is still running.';
			return;
		}
		if (socket || connecting) return;
		if (!nickname.trim()) {
			error = 'Please pick a display name first.';
			return;
		}

		connecting = true;
		error = null;

		const name = nickname.trim();

		if (mode === 'up') {
			const allowed = await verifyUsernamePermission(name);
			if (!allowed) {
				connecting = false;
				return;
			}
		}

		if (mode === 'failover') {
			const isAdminAuthorized = await verifyFailoverAdminPassword();
			if (!isAdminAuthorized) {
				connecting = false;
				return;
			}
		}

		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const encodedName = encodeURIComponent(name);
		let url = `${protocol}//${window.location.host}/api/failover/chat/ws?name=${encodedName}`;
		if (mode === 'up') {
			const token = getAuthToken();
			if (token) {
				url += `&tk=${encodeURIComponent(token)}`;
			}
		} else if (mode === 'failover') {
			url += '&official=1';
		}

		socket = new WebSocket(url);

		socket.addEventListener('open', () => {
			connected = true;
			connecting = false;
		});

		socket.addEventListener('message', (event) => {
			if (typeof event.data !== 'string') return;

			let payload: ChatEnvelope;
			try {
				payload = JSON.parse(event.data) as ChatEnvelope;
			} catch {
				return;
			}
			if (payload.type === 'init' && payload.history) {
				messages = payload.history;
				scrollToBottom();
				return;
			}

			if (payload.type === 'message' && payload.message) {
				messages = [...messages, payload.message];
				scrollToBottom();
			}
		});

		socket.addEventListener('close', () => {
			connected = false;
			connecting = false;
			socket = null;
		});

		socket.addEventListener('error', () => {
			error = 'Connection failed. Try reconnecting.';
			connected = false;
			connecting = false;
			socket = null;
		});
	}

	function disconnect() {
		socket?.close();
		socket = null;
		connected = false;
		connecting = false;
	}

	function sendMessage() {
		if (!connected || !socket) return;
		const text = messageInput.trim();
		if (!text) return;

		socket.send(
			JSON.stringify({
				type: 'chat',
				name: nickname.trim(),
				avatarUrl,
				text
			})
		);

		messageInput = '';
	}

	function scrollToBottom() {
		requestAnimationFrame(() => {
			if (messageViewport) {
				messageViewport.scrollTop = messageViewport.scrollHeight;
			}
		});
	}

	onMount(() => {
		void detectMode();
	});

	onDestroy(() => {
		disconnect();
	});
</script>

<div class="mx-auto flex h-[calc(100vh-3.5rem)] max-w-3xl flex-col p-4">
	<div class="card flex min-h-0 flex-1 border border-base-300 bg-base-100 shadow-lg">
		<div class="card-body flex min-h-0 flex-1 gap-3">
			<div>
				<div class="mb-2 flex items-center gap-4">
					<h1 class="text-2xl font-bold">Moon Network</h1>
					<span class={`badge ${mode === 'up' ? 'badge-success' : mode === 'failover' ? 'badge-warning' : 'badge-neutral'}`}>
						{mode}
					</span>
				</div>
				<p class="text-sm text-base-content/70">{modeHint}</p>
			</div>

			{#if identityLocked}
				<div class="flex items-center gap-3 rounded-lg border border-base-300 bg-base-200/50 p-2">
					{#if avatarUrl}
						<img src={avatarUrl} alt={nickname} class="h-9 w-9 rounded-full object-cover" />
					{:else}
						<div class="flex h-9 w-9 items-center justify-center rounded-full bg-base-300 text-sm font-semibold">
							{initials(nickname)}
						</div>
					{/if}
					<div>
						<p class="text-sm font-semibold">Authenticated identity</p>
						<p class="text-xs text-base-content/60">{nickname}</p>
					</div>
				</div>
			{/if}

			<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
				<input
					class="input-bordered input w-full"
					placeholder="Your display name"
					bind:value={nickname}
					disabled={connected || connecting || identityLocked || mode === 'checking'}
				/>
				{#if connected}
					<button class="btn btn-error" onclick={disconnect}>Disconnect</button>
				{:else}
					<button class="btn btn-primary" onclick={connect} disabled={connecting || mode === 'checking'}>
						{connecting ? 'Connecting...' : 'Join room'}
					</button>
				{/if}
			</div>

			{#if mode === 'failover' && !connected}
				<input
					type="password"
					class="input-bordered input w-full"
					placeholder="Failover admin password"
					bind:value={adminPassword}
					disabled={connecting}
				/>
			{/if}

			{#if error}
				<div class="alert text-sm alert-error">{error}</div>
			{/if}

			<div
				bind:this={messageViewport}
				class="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-base-300 p-3"
			>
				{#if messages.length === 0}
					<p class="text-sm text-base-content/60">No messages yet.</p>
				{:else}
					{#each messages as message (message.id)}
						{#if message.type === 'system'}
							<div class="rounded-lg bg-base-200 px-2 py-1 text-xs text-base-content/70">
								<span class="font-medium">System</span>
								<span class="mx-1">·</span>
								<span>{new Date(message.createdAt).toLocaleTimeString()}</span>
								<span class="mx-1">·</span>
								<span>{message.text}</span>
							</div>
						{:else}
							<div class="rounded-lg bg-base-300/50 p-2 text-sm">
								<div class="mb-1 flex items-center justify-between gap-2">
									<div class="flex items-center gap-2">
										{#if message.avatarUrl}
											<img src={message.avatarUrl} alt={message.name} class="h-6 w-6 rounded-full object-cover" />
										{:else}
											<div class="flex h-6 w-6 items-center justify-center rounded-full bg-base-200 text-xs font-semibold">
												{initials(message.name)}
											</div>
										{/if}
										<span class="font-semibold">{message.name}</span>
										{#if message.isOfficial}
											<span class="badge badge-xs badge-info">Official</span>
										{/if}
									</div>
									<span class="text-xs text-base-content/60">
										{new Date(message.createdAt).toLocaleTimeString()}
									</span>
								</div>
								<div class="space-y-1 break-words text-base-content">
									{#each parseMarkdownLines(message.text) as line, lineIndex (lineIndex)}
										<p class="m-0">
											{#each line as token, tokenIndex (tokenIndex)}
												{#if token.type === 'bold'}
													<strong>{token.text}</strong>
												{:else if token.type === 'italic'}
													<em>{token.text}</em>
												{:else if token.type === 'code'}
													<code class="rounded bg-base-200 px-1 py-0.5">{token.text}</code>
												{:else if token.type === 'link' && token.href}
													<button
														type="button"
														class="link link-primary inline p-0"
														onclick={() => window.open(token.href, '_blank', 'noopener,noreferrer')}
													>
														{token.text}
													</button>
												{:else}
													{token.text}
												{/if}
											{/each}
										</p>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				{/if}
			</div>

			<div class="flex gap-2">
				<input
					class="input-bordered input w-full"
					placeholder={connected ? 'Type room update...' : 'Connect first to chat'}
					bind:value={messageInput}
					disabled={!connected}
					onkeydown={(event) => {
						if (event.key === 'Enter') sendMessage();
					}}
				/>
				<button class="btn btn-primary" onclick={sendMessage} disabled={!connected}>Send</button>
			</div>
		</div>
	</div>
</div>
