import type { Account } from './post';

export type ChatMessageType = 'chat' | 'systemAward' | 'systemJoin' | 'systemLeave' | 'systemInfo';

export interface ChatMessage {
	id: string;
	senderId: string;
	sender: Account;
	senderName?: string | null;
	message: string;
	isMine: boolean;
	createdAt?: string | null;
	messageType: ChatMessageType;
	metadata?: Record<string, unknown> | null;
}

export interface LivestreamDetail {
	id?: string;
	title?: string;
	description?: string;
	status?: string | number;
	thumbnail?: { id?: string } | null;
	thumbnailId?: string | null;
	hlsPlaylistPath?: string | null;
	publisher?: {
		name?: string;
		nick?: string;
		picture?: { id?: string } | null;
	} | null;
}

export interface LivestreamCredentials {
	url: string;
	token: string;
	roomName?: string;
	isStreamer?: boolean;
	identity?: string;
}

export interface LivestreamLeaderboardEntry {
	rank: number;
	accountId: string;
	senderName: string;
	totalAmount: number;
	awardCount: number;
	account?: {
		name?: string;
		nick?: string;
		profile?: { picture?: { id?: string } | null } | null;
	} | null;
}
