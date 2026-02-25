import type { PageServerLoad } from './$types';
import type { Post } from '$lib/types/post';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch('https://api.solian.app/sphere/posts?take=20&replies=false');

		if (!response.ok) {
			throw new Error(`Failed to fetch posts: ${response.status}`);
		}

		const posts: Post[] = await response.json();

		return {
			posts,
			error: null,
			seo: {
				title: 'Explore',
				description: 'Discover fresh posts and updates across Solar Network.'
			}
		};
	} catch (error) {
		console.error('Error fetching posts:', error);
		return {
			posts: [],
			error: error instanceof Error ? error.message : 'Failed to load posts',
			seo: {
				title: 'Explore',
				description: 'Browse posts and updates from the Solar Network community.'
			}
		};
	}
};
