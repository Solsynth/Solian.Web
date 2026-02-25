import type { PageServerLoad } from './$types';
import { snakeToCamel } from '$lib/utils/case';
import type { LivestreamDetail } from '$lib/types/livestream';
import { excerptText } from '$lib/seo';
import { getFileUrl } from '$lib/utils/files';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { id } = params;
	try {
		const response = await fetch(
			`https://api.solian.app/sphere/livestreams/${encodeURIComponent(id)}`
		);
		if (!response.ok) {
			if (response.status === 404) {
				return {
					livestream: null as LivestreamDetail | null,
					error: 'Livestream not found.',
					seo: {
						title: 'Livestream not found',
						description: 'The requested livestream was not found.',
						robots: 'noindex, nofollow'
					}
				};
			}
			throw new Error(`Failed to load livestream (${response.status})`);
		}

		const raw = (await response.json()) as unknown;
		const livestream = snakeToCamel<LivestreamDetail>(raw);
		return {
			livestream,
			error: null as string | null,
			seo: {
				title: livestream.title || 'Livestream',
				description: excerptText(
					livestream.description || 'Watch live content on Solar Network livestreams.'
				),
				type: 'article',
				image: getFileUrl(livestream.thumbnail?.id ?? livestream.thumbnailId)
			}
		};
	} catch (error) {
		return {
			livestream: null as LivestreamDetail | null,
			error: error instanceof Error ? error.message : 'Failed to load livestream.',
			seo: {
				title: 'Livestream',
				description: 'Watch live and recorded streams on Solar Network.'
			}
		};
	}
};
