import type { PageServerLoad } from './$types';
import { snakeToCamel } from '$lib/utils/case';
import type { LivestreamDetail } from '$lib/types/livestream';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { id } = params;
	try {
		const response = await fetch(
			`https://api.solian.app/sphere/livestreams/${encodeURIComponent(id)}`
		);
		if (!response.ok) {
			if (response.status === 404) {
				return { livestream: null as LivestreamDetail | null, error: 'Livestream not found.' };
			}
			throw new Error(`Failed to load livestream (${response.status})`);
		}

		const raw = (await response.json()) as unknown;
		const livestream = snakeToCamel<LivestreamDetail>(raw);
		return { livestream, error: null as string | null };
	} catch (error) {
		return {
			livestream: null as LivestreamDetail | null,
			error: error instanceof Error ? error.message : 'Failed to load livestream.'
		};
	}
};
