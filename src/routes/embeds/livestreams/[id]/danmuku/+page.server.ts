import type { PageServerLoad } from './$types';
import { snakeToCamel } from '$lib/utils/case';
import type { LivestreamDetail } from '$lib/types/livestream';
import { API_BASE_URL } from '$lib/utils/api';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { id } = params;
	console.log('[EMBED CHAT] Loading livestream:', id);

	try {
		console.log('[EMBED CHAT] Fetching livestream data...');
		const livestreamRes = await fetch(
			`${API_BASE_URL}/sphere/livestreams/${encodeURIComponent(id)}`
		);
		console.log('[EMBED CHAT] Livestream response status:', livestreamRes.status);

		if (!livestreamRes.ok) {
			if (livestreamRes.status === 404) {
				return {
					livestream: null as LivestreamDetail | null,
					error: 'Livestream not found.'
				};
			}
			throw new Error(`Failed to load livestream (${livestreamRes.status})`);
		}

		const rawLivestream = (await livestreamRes.json()) as unknown;
		console.log('[EMBED CHAT] Livestream data:', JSON.stringify(rawLivestream).slice(0, 200));
		const livestream = snakeToCamel<LivestreamDetail>(rawLivestream);

		return {
			livestream,
			error: null as string | null
		};
	} catch (error) {
		console.error('[EMBED CHAT] Error:', error);
		return {
			livestream: null as LivestreamDetail | null,
			error: error instanceof Error ? error.message : 'Failed to load livestream.'
		};
	}
};
