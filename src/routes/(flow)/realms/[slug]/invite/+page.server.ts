import type { PageServerLoad } from './$types';
import type { Realm } from '$lib/types/realm';
import { excerptText } from '$lib/seo';
import { getFileUrl } from '$lib/utils/files';
import { API_BASE_URL } from '$lib/utils/api';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const slug = params.slug || '';
	if (!slug) {
		return {
			realm: null,
			notFound: true,
			error: 'Invalid realm slug',
			seo: {
				title: 'Realm invite',
				description: 'Join a realm on Solar Network.',
				robots: 'noindex, nofollow'
			}
		};
	}

	try {
		const response = await fetch(`${API_BASE_URL}/pass/realms/${encodeURIComponent(slug)}`);
		if (!response.ok) {
			if (response.status === 404) {
				return {
					realm: null,
					notFound: true,
					error: null,
					seo: {
						title: 'Realm invite',
						description: 'The invite link is invalid or expired.',
						robots: 'noindex, nofollow'
					}
				};
			}
			throw new Error(`Failed to fetch realm: ${response.status}`);
		}
		const realm: Realm = await response.json();
		return {
			realm,
			notFound: false,
			error: null,
			seo: {
				title: `Invite to ${realm.name}`,
				description: excerptText(realm.description || `Join ${realm.name} on Solar Network.`),
				image: getFileUrl(realm.picture?.id),
				robots: 'noindex, nofollow'
			}
		};
	} catch (error) {
		return {
			realm: null,
			notFound: false,
			error: error instanceof Error ? error.message : 'Failed to load realm',
			seo: {
				title: 'Realm invite',
				description: 'Join a realm on Solar Network.',
				robots: 'noindex, nofollow'
			}
		};
	}
};
