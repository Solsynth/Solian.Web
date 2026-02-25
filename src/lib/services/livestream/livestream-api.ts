import { apiClient } from '$lib/utils/api';
import { snakeToCamel } from '$lib/utils/case';
import type {
	LivestreamCredentials,
	LivestreamDetail,
	LivestreamLeaderboardEntry
} from '$lib/types/livestream';

function readString(source: Record<string, unknown>, keys: string[]): string | null {
	for (const key of keys) {
		const value = source[key];
		if (typeof value === 'string' && value.trim() !== '') return value;
	}
	return null;
}

export async function fetchLivestreamDetail(livestreamId: string): Promise<LivestreamDetail> {
	const resp = await apiClient(`/sphere/livestreams/${encodeURIComponent(livestreamId)}`);
	const raw = (await resp.json()) as unknown;
	return snakeToCamel<LivestreamDetail>(raw);
}

export async function fetchLivestreamCredentials(
	livestreamId: string,
	embed?: Record<string, unknown>
): Promise<LivestreamCredentials> {
	const embeddedUrl =
		embed && typeof embed === 'object'
			? readString(embed, ['serverUrl', 'server_url', 'wsUrl', 'ws_url', 'url'])
			: null;
	const embeddedToken =
		embed && typeof embed === 'object'
			? readString(embed, ['participantToken', 'participant_token', 'token'])
			: null;
	if (embeddedUrl && embeddedToken) {
		return { url: embeddedUrl, token: embeddedToken };
	}

	const resp = await apiClient(`/sphere/livestreams/${encodeURIComponent(livestreamId)}/token`, {
		method: 'GET'
	});
	const raw = (await resp.json()) as unknown;
	const payload = snakeToCamel<Record<string, unknown>>(raw);
	const url = readString(payload, ['serverUrl', 'wsUrl', 'endpoint', 'url']);
	const token = readString(payload, ['participantToken', 'token', 'accessToken']);
	if (!url || !token) {
		throw new Error('Unable to retrieve livestream credentials.');
	}

	return {
		url,
		token,
		roomName: readString(payload, ['roomName']) || undefined,
		identity: readString(payload, ['identity']) || undefined,
		isStreamer: Boolean(payload.isStreamer)
	};
}

export async function fetchLivestreamLeaderboard(
	livestreamId: string,
	limit = 10
): Promise<LivestreamLeaderboardEntry[]> {
	try {
		const resp = await apiClient(
			`/sphere/livestreams/${encodeURIComponent(livestreamId)}/awards/leaderboard?limit=${limit}`
		);
		const raw = (await resp.json()) as unknown;
		return snakeToCamel<LivestreamLeaderboardEntry[]>(raw);
	} catch {
		return [];
	}
}
