import type { PageServerLoad } from './$types';
import type { Post } from '$lib/types/post';
import type { Realm } from '$lib/types/realm';
import { redirect } from '@sveltejs/kit';

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
			initialTake: TAKE
		};
	}

	try {
		const realmResponse = await fetch(`https://api.solian.app/pass/realms/${encodeURIComponent(slug)}`);
		if (!realmResponse.ok) {
			if (realmResponse.status === 404) {
				return {
					realm: null,
					posts: [],
					error: null,
					notFound: true,
					total: 0,
					initialTake: TAKE
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

		if (includeReplies === 'true' || includeReplies === 'false') query.set('replies', includeReplies);
		if (mediaOnly === 'true' || mediaOnly === 'false') query.set('media', mediaOnly);
		if (queryTerm) query.set('query', queryTerm);
		if (type === '0' || type === '1') query.set('type', type);

		const postsResponse = await fetch(`https://api.solian.app/sphere/posts?${query.toString()}`);
		const posts: Post[] = postsResponse.ok ? await postsResponse.json() : [];
		const total = parseInt(postsResponse.headers.get('x-total') || '0', 10);

		return {
			realm,
			posts,
			error: null,
			notFound: false,
			total,
			initialTake: TAKE
		};
	} catch (error) {
		return {
			realm: null,
			posts: [],
			error: error instanceof Error ? error.message : 'Failed to load realm',
			notFound: false,
			total: 0,
			initialTake: TAKE
		};
	}
};
