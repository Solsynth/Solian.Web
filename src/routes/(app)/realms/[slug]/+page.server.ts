import type { PageServerLoad } from './$types';
import type { Post } from '$lib/types/post';
import type { Realm } from '$lib/types/realm';
import { redirect } from '@sveltejs/kit';
import { excerptText } from '$lib/seo';
import { getFileUrl } from '$lib/utils/files';
import { API_BASE_URL } from '$lib/utils/api';

const TAKE = 20;

export const load: PageServerLoad = async ({ fetch, params, url }) => {
	const slug = params.slug || '';
	if (url.searchParams.has('invite')) {
		const passthrough = new URLSearchParams(url.searchParams);
		passthrough.delete('invite');
		const qs = passthrough.toString();
		throw redirect(302, `/realms/${encodeURIComponent(slug)}/invite${qs ? `?${qs}` : ''}`);
	}

	if (!slug) {
		return {
			realm: null,
			posts: [],
			error: 'Invalid realm slug',
			notFound: true,
			total: 0,
			initialTake: TAKE,
			seo: {
				title: 'Realm not found',
				description: 'The requested realm is invalid.',
				robots: 'noindex, nofollow'
			}
		};
	}

	try {
		const realmResponse = await fetch(`${API_BASE_URL}/passport/realms/${encodeURIComponent(slug)}`);
		if (!realmResponse.ok) {
			if (realmResponse.status === 404) {
				return {
					realm: null,
					posts: [],
					error: null,
					notFound: true,
					total: 0,
					initialTake: TAKE,
					seo: {
						title: 'Realm not found',
						description: 'The requested realm does not exist.',
						robots: 'noindex, nofollow'
					}
				};
			}
			throw new Error(`Failed to fetch realm: ${realmResponse.status}`);
		}

		const realm: Realm = await realmResponse.json();

		const query = new URLSearchParams({
			take: String(TAKE),
			offset: '0',
			realm: slug,
			orderDesc: url.searchParams.get('orderDesc') ?? 'true'
		});

		const includeReplies = url.searchParams.get('replies');
		const mediaOnly = url.searchParams.get('media');
		const queryTerm = url.searchParams.get('query');
		const type = url.searchParams.get('type');

		if (includeReplies === 'true' || includeReplies === 'false')
			query.set('replies', includeReplies);
		if (mediaOnly === 'true' || mediaOnly === 'false') query.set('media', mediaOnly);
		if (queryTerm) query.set('query', queryTerm);
		if (type === '0' || type === '1') query.set('type', type);

		const postsResponse = await fetch(`${API_BASE_URL}/sphere/posts?${query.toString()}`);
		const posts: Post[] = postsResponse.ok ? await postsResponse.json() : [];
		const total = parseInt(postsResponse.headers.get('x-total') || '0', 10);

		return {
			realm,
			posts,
			error: null,
			notFound: false,
			total,
			initialTake: TAKE,
			seo: {
				title: realm.name,
				description: excerptText(
					realm.description || `Join the ${realm.name} realm on Solar Network.`
				),
				image: getFileUrl(realm.picture?.id)
			}
		};
	} catch (error) {
		return {
			realm: null,
			posts: [],
			error: error instanceof Error ? error.message : 'Failed to load realm',
			notFound: false,
			total: 0,
			initialTake: TAKE,
			seo: {
				title: 'Realm',
				description: 'Discover communities and posts in Solar Network realms.'
			}
		};
	}
};
