import type { RequestHandler } from './$types';

interface ChatKvNamespace {
	get(key: string, options?: { type: 'json' }): Promise<unknown>;
	put(key: string, value: string, options?: { expirationTtl: number }): Promise<void>;
}

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

interface IncomingPayload {
	type: 'chat';
	name: string;
	avatarUrl?: string;
	text: string;
}

interface RoomClient {
	socket: WebSocket;
	name: string;
	isOfficial: boolean;
}

interface RuntimeChatState {
	clients: Set<RoomClient>;
	history: ChatMessage[];
}

const MAX_NAME_LENGTH = 30;
const MAX_AVATAR_URL_LENGTH = 500;
const MAX_TEXT_LENGTH = 500;
const MAX_HISTORY = 120;
const HISTORY_KEY = 'failover-chat-history-v1';
const HISTORY_TTL_SECONDS = 60 * 60 * 24;
const HISTORY_TTL_MS = HISTORY_TTL_SECONDS * 1000;

const runtime = globalThis as typeof globalThis & {
	__failoverChatState?: RuntimeChatState;
};

if (!runtime.__failoverChatState) {
	runtime.__failoverChatState = {
		clients: new Set<RoomClient>(),
		history: []
	};
}

const clients = runtime.__failoverChatState.clients;
const history = runtime.__failoverChatState.history;

function sanitizeName(value: string | null): string {
	const fallback = 'Anonymous';
	if (!value) return fallback;
	const trimmed = value.trim();
	if (!trimmed) return fallback;
	return trimmed.slice(0, MAX_NAME_LENGTH);
}

function sanitizeText(value: string): string {
	return value.trim().slice(0, MAX_TEXT_LENGTH);
}

function sanitizeAvatarUrl(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	return trimmed.slice(0, MAX_AVATAR_URL_LENGTH);
}

function parseCookieValue(cookieHeader: string | null, key: string): string | null {
	if (!cookieHeader) return null;
	const pairs = cookieHeader.split(';');
	for (const pair of pairs) {
		const [rawKey, ...rest] = pair.trim().split('=');
		if (rawKey !== key) continue;
		return rest.join('=') || null;
	}
	return null;
}

function pushHistory(message: ChatMessage): void {
	history.push(message);
	if (history.length > MAX_HISTORY) {
		history.splice(0, history.length - MAX_HISTORY);
	}
}

function pruneExpiredMessages(input: ChatMessage[]): ChatMessage[] {
	const cutoff = Date.now() - HISTORY_TTL_MS;
	return input.filter((message) => {
		const createdAtMs = Date.parse(message.createdAt);
		return Number.isFinite(createdAtMs) && createdAtMs >= cutoff;
	});
}

function normalizePersistedHistory(input: unknown): ChatMessage[] {
	if (!Array.isArray(input)) return [];
	return input.filter((item): item is ChatMessage => {
		if (!item || typeof item !== 'object') return false;
		const msg = item as Record<string, unknown>;
		return (
			typeof msg.id === 'string' &&
			(msg.type === 'chat' || msg.type === 'system') &&
			typeof msg.name === 'string' &&
			(msg.avatarUrl === undefined || typeof msg.avatarUrl === 'string') &&
			(msg.isOfficial === undefined || typeof msg.isOfficial === 'boolean') &&
			typeof msg.text === 'string' &&
			typeof msg.createdAt === 'string'
		);
	});
}

async function loadHistoryFromKv(kv: ChatKvNamespace | undefined): Promise<ChatMessage[]> {
	if (!kv) return [...history];

	const raw = await kv.get(HISTORY_KEY, { type: 'json' });
	const parsed = pruneExpiredMessages(normalizePersistedHistory(raw));
	history.length = 0;
	history.push(...parsed.slice(-MAX_HISTORY));
	return [...history];
}

async function persistHistoryToKv(kv: ChatKvNamespace | undefined): Promise<void> {
	if (!kv) return;
	await kv.put(HISTORY_KEY, JSON.stringify(history), { expirationTtl: HISTORY_TTL_SECONDS });
}

function send(client: RoomClient, payload: ChatEnvelope): void {
	try {
		client.socket.send(JSON.stringify(payload));
	} catch {
		clients.delete(client);
	}
}

function broadcast(payload: ChatEnvelope): void {
	for (const client of clients) {
		send(client, payload);
	}
}

function createMessage(
	type: 'chat' | 'system',
	name: string,
	text: string,
	avatarUrl?: string,
	isOfficial?: boolean
): ChatMessage {
	return {
		id: crypto.randomUUID(),
		type,
		name,
		avatarUrl,
		isOfficial,
		text,
		createdAt: new Date().toISOString()
	};
}

function broadcastSystem(text: string): void {
	const message = createMessage('system', 'System', text);
	pushHistory(message);
	broadcast({ type: 'message', message });
}

export const GET: RequestHandler = async ({ request, url, platform }) => {
	if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
		return new Response('Expected websocket request', { status: 426 });
	}
	const kv = (
		platform as
			| {
					env?: {
						FAILOVER_CHAT_KV?: ChatKvNamespace;
					};
			  }
			| undefined
	)?.env?.FAILOVER_CHAT_KV;
	const configuredFailoverPassword = (
		platform as
			| {
					env?: {
						FAILOVER_ADMIN_PASSWORD?: string;
					};
			  }
			| undefined
	)?.env?.FAILOVER_ADMIN_PASSWORD;

	const pair = new WebSocketPair();
	const clientSocket = pair[0];
	const serverSocket = pair[1];

	const name = sanitizeName(url.searchParams.get('name'));
	const wantsOfficial = url.searchParams.get('official') === '1';
	let isOfficial = false;

	if (configuredFailoverPassword && wantsOfficial) {
		const failoverCookie = parseCookieValue(request.headers.get('cookie'), 'failover_admin');
		if (failoverCookie !== '1') {
			return new Response('Failover admin authorization is required for official mode.', {
				status: 403
			});
		}
		isOfficial = true;
	}

	serverSocket.accept();

	const initialHistory = await loadHistoryFromKv(kv);
	const client: RoomClient = {
		socket: serverSocket,
		name,
		isOfficial
	};

	clients.add(client);
	send(client, {
		type: 'init',
		history: initialHistory
	});

	broadcastSystem(`${name} joined the room${isOfficial ? ' as official.' : '.'}`);
	void persistHistoryToKv(kv);

	serverSocket.addEventListener('message', (event: MessageEvent) => {
		if (typeof event.data !== 'string') return;

		let payload: IncomingPayload;
		try {
			payload = JSON.parse(event.data) as IncomingPayload;
		} catch {
			return;
		}

		if (payload.type !== 'chat') return;

		const message = sanitizeText(payload.text || '');
		if (!message) return;

		const sender = client.name;
		const avatarUrl = sanitizeAvatarUrl(payload.avatarUrl);
		const chatMessage = createMessage('chat', sender, message, avatarUrl, client.isOfficial);
		pushHistory(chatMessage);
		broadcast({ type: 'message', message: chatMessage });
		void persistHistoryToKv(kv);
	});

	serverSocket.addEventListener('close', () => {
		clients.delete(client);
		broadcastSystem(`${client.name} left the room.`);
		void persistHistoryToKv(kv);
	});

	serverSocket.addEventListener('error', () => {
		clients.delete(client);
	});

	return new Response(null, {
		status: 101,
		webSocket: clientSocket
	} as ResponseInit & { webSocket: WebSocket });
};
