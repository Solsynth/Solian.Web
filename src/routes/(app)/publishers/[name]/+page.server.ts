import type { PageServerLoad } from './$types';
import type { Post } from '$lib/types/post';
import type { PublisherProfile } from '$lib/types/publisher';

const TAKE = 20;

export const load: PageServerLoad = async ({ fetch, params, url }) => {
	const rawName = params.name || '';
	const username = rawName.startsWith('@') ? rawName.slice(1) : rawName;

	if (!username) {
		return {
			publisher: null,
			posts: [],
			error: 'Invalid publisher name',
			notFound: true,
			total: 0,
			initialTake: TAKE
		};
	}

	try {
		const publisherResponse = await fetch(
			`https://api.solian.app/sphere/publishers/${encodeURIComponent(username)}`
		);

		if (!publisherResponse.ok) {
			if (publisherResponse.status === 404) {
				return {
					publisher: null,
					posts: [],
					error: null,
					notFound: true,
					total: 0,
					initialTake: TAKE
				};
			}
			throw new Error(`Failed to fetch publisher: ${publisherResponse.status}`);
		}

		const publisher: PublisherProfile = await publisherResponse.json();

		const query = new URLSearchParams({
			take: String(TAKE),
			offset: '0',
			pub: username,
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
			publisher,
			posts,
			error: null,
			notFound: false,
			total,
			initialTake: TAKE
		};
	} catch (error) {
		return {
			publisher: null,
			posts: [],
			error: error instanceof Error ? error.message : 'Failed to load publisher profile',
			notFound: false,
			total: 0,
			initialTake: TAKE
		};
	}
};
