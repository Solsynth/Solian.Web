import type { PageServerLoad } from './$types';
import type { Post } from '$lib/types/post';

export const load: PageServerLoad = async ({ fetch, params }) => {
	try {
		const response = await fetch(`https://api.solian.app/sphere/posts/${params.id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return { post: null, replies: [], error: 'Post not found' };
			}
			throw new Error(`Failed to fetch post: ${response.status}`);
		}

		const post: Post = await response.json();

		// Fetch replies
		const repliesResponse = await fetch(
			`https://api.solian.app/sphere/posts/${params.id}/replies?take=50`
		);
		const replies: Post[] = repliesResponse.ok ? await repliesResponse.json() : [];

		return { post, replies, error: null };
	} catch (error) {
		console.error('Error fetching post:', error);
		return {
			post: null,
			replies: [],
			error: error instanceof Error ? error.message : 'Failed to load post'
		};
	}
};
