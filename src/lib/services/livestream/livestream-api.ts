import { apiClient } from '$lib/utils/api';
import { snakeToCamel } from '$lib/utils/case';
import type {
	LivestreamCredentials,
	LivestreamDetail,
	LivestreamLeaderboardEntry
} from '$lib/types/livestream';

export async function fetchLivestreamDetail(livestreamId: string): Promise<LivestreamDetail> {
	const resp = await apiClient(`/sphere/livestreams/${encodeURIComponent(livestreamId)}`);
	const raw = (await resp.json()) as unknown;
	return snakeToCamel<LivestreamDetail>(raw);
}

export async function fetchLivestreamCredentials(
	livestreamId: string
): Promise<LivestreamCredentials> {
	const resp = await apiClient(`/sphere/livestreams/${encodeURIComponent(livestreamId)}/token`, {
		method: 'GET'
	});
	const raw = (await resp.json()) as unknown;
	const payload = snakeToCamel<Record<string, unknown>>(raw);

	return {
		url: payload.url as string,
		token: payload.token as string,
		roomName: (payload.roomName || undefined) as string | undefined,
		identity: (payload.identity || undefined) as string | undefined,
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
