import type { RequestHandler } from './$types';
import type { Post } from '$lib/types/post';

export const GET: RequestHandler = async ({ fetch, params, url }) => {
	const slug = params.slug || '';
	if (!slug) {
		return new Response(JSON.stringify({ error: 'Invalid realm slug' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const take = Math.max(1, Math.min(50, parseInt(url.searchParams.get('take') || '20', 10)));
	const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

	try {
		const query = new URLSearchParams({
			take: String(take),
			offset: String(offset),
			realm: slug,
			orderDesc: url.searchParams.get('orderDesc') ?? 'true'
		});

		const passthroughKeys = [
			'replies',
			'media',
			'query',
			'order',
			'periodStart',
			'periodEnd',
			'type'
		];
		for (const key of passthroughKeys) {
			const value = url.searchParams.get(key);
			if (value != null && value !== '') query.set(key, value);
		}

		const response = await fetch(`https://api.solian.app/sphere/posts?${query.toString()}`);
		if (!response.ok) throw new Error(`Failed to fetch posts: ${response.status}`);

		const posts: Post[] = await response.json();
		const total = parseInt(response.headers.get('x-total') || '0', 10);

		return new Response(JSON.stringify({ posts, total }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to load posts' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
