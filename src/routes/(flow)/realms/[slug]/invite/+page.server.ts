import type { PageServerLoad } from './$types';
import type { Realm } from '$lib/types/realm';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const slug = params.slug || '';
	if (!slug) {
		return { realm: null, notFound: true, error: 'Invalid realm slug' };
	}

	try {
		const response = await fetch(`https://api.solian.app/pass/realms/${encodeURIComponent(slug)}`);
		if (!response.ok) {
			if (response.status === 404) {
				return { realm: null, notFound: true, error: null };
			}
			throw new Error(`Failed to fetch realm: ${response.status}`);
		}
		const realm: Realm = await response.json();
		return { realm, notFound: false, error: null };
	} catch (error) {
		return {
			realm: null,
			notFound: false,
			error: error instanceof Error ? error.message : 'Failed to load realm'
		};
	}
};
