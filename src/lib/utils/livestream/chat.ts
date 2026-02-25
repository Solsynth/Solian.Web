import type { ChatMessage } from '$lib/types/livestream';
import { snakeToCamel } from '$lib/utils/case';

export function isSuperchatMessage(message: ChatMessage): boolean {
	return message.messageType === 'systemAward';
}

function readNumber(input: unknown): number {
	if (typeof input === 'number') return input;
	if (typeof input === 'string') return Number.parseFloat(input) || 0;
	return 0;
}

function readDate(input: unknown): Date | null {
	if (typeof input === 'string') {
		const date = new Date(input);
		return Number.isNaN(date.getTime()) ? null : date;
	}
	if (typeof input === 'number') {
		const ms = input > 1_000_000_000_000 ? input : input * 1000;
		const date = new Date(ms);
		return Number.isNaN(date.getTime()) ? null : date;
	}
	return null;
}

function superchatHighlightSeconds(message: ChatMessage): number {
	return readNumber(message.metadata?.highlightSeconds ?? message.metadata?.highlight_seconds);
}

function superchatActiveUntil(message: ChatMessage): Date | null {
	return readDate(message.metadata?.activeUntil ?? message.metadata?.active_until);
}

export function isSuperchatActive(message: ChatMessage, now = new Date()): boolean {
	if (!isSuperchatMessage(message)) return false;
	const activeUntil = superchatActiveUntil(message);
	if (activeUntil) return activeUntil.getTime() > now.getTime();
	const seconds = superchatHighlightSeconds(message);
	if (seconds <= 0 || !message.createdAt) return false;
	const createdAt = new Date(message.createdAt);
	if (Number.isNaN(createdAt.getTime())) return false;
	return createdAt.getTime() + seconds * 1000 > now.getTime();
}

export function latestActiveSuperchat(messages: ChatMessage[], now = new Date()): ChatMessage | null {
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		if (isSuperchatActive(messages[i], now)) return messages[i];
	}
	return null;
}

export function parseLivestreamEventPayload(
	payloadText: string,
	senderIdentity = 'viewer'
): ChatMessage | null {
	const trimmed = payloadText.trim();
	if (!trimmed) return null;

	try {
		const parsed = snakeToCamel<Record<string, unknown>>(JSON.parse(trimmed));
		const eventType = typeof parsed.type === 'string' ? parsed.type : '';

		if (eventType === 'streamAwarded') {
			const amount = readNumber(parsed.amount);
			const senderName = (parsed.senderName as string) || senderIdentity || 'Someone';
			const senderId = (parsed.senderId as string) || '';
			const highlightSeconds = readNumber(parsed.highlightSeconds);
			const createdAt = new Date().toISOString();
			const metadata: Record<string, unknown> = { amount, highlightSeconds };
			if (highlightSeconds > 0) {
				metadata.activeUntil = new Date(Date.now() + highlightSeconds * 1000).toISOString();
			}
			return {
				id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				senderId,
				sender: senderName,
				senderIdentity,
				message: typeof parsed.message === 'string' ? parsed.message : '',
				isMine: false,
				createdAt,
				messageType: 'systemAward',
				metadata
			};
		}

		if (eventType === 'timeout') {
			return null;
		}

		if (typeof parsed.content === 'string') {
			return {
				id:
					(typeof parsed.id === 'string' && parsed.id) ||
					`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				senderId: (parsed.senderId as string) || '',
				sender:
					(typeof parsed.senderName === 'string' && parsed.senderName) ||
					(senderIdentity || 'Unknown'),
				senderIdentity,
				message: parsed.content,
				isMine: false,
				createdAt:
					(typeof parsed.createdAt === 'string' && parsed.createdAt) || new Date().toISOString(),
				messageType: 'chat'
			};
		}
	} catch {
		// fallback plain text message
	}

	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		senderId: '',
		sender: senderIdentity || 'viewer',
		senderIdentity,
		message: trimmed,
		isMine: false,
		createdAt: new Date().toISOString(),
		messageType: 'chat'
	};
}
