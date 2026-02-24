import type { RequestHandler } from './$types';
import type { Post } from '$lib/types/post';

export const GET: RequestHandler = async ({ fetch, url }) => {
	const offset = url.searchParams.get('offset');
	const take = parseInt(url.searchParams.get('take') || '20');

	try {
		let apiUrl = `https://api.solian.app/sphere/posts?take=${take}`;
		if (offset) {
			apiUrl += `&offset=${encodeURIComponent(offset)}`;
		}

		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch posts: ${response.status}`);
		}

		const posts: Post[] = await response.json();

		return new Response(JSON.stringify({ posts }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Failed to load posts'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
