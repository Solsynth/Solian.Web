import type { PageServerLoad } from './$types';
import type { Post } from '$lib/types/post';
import { dev } from '$app/environment';

const HEALTH_URL = 'https://api.solian.app/health';
const HEALTH_TIMEOUT_MS = 3500;
const MOCK_DOWN_QUERY = 'mock_down';

async function isHealthDown(fetchFn: typeof fetch): Promise<boolean> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

	try {
		const response = await fetchFn(HEALTH_URL, {
			method: 'GET',
			cache: 'no-store',
			signal: controller.signal
		});
		return response.status !== 200;
	} catch {
		return true;
	} finally {
		clearTimeout(timeout);
	}
}

export const load: PageServerLoad = async ({ fetch, url }) => {
	const mockDown = dev && url.searchParams.get(MOCK_DOWN_QUERY) === '1';
	const healthDown = mockDown || (await isHealthDown(fetch));

	try {
		const response = await fetch('https://api.solian.app/sphere/posts?take=20&replies=false');

		if (!response.ok) {
			throw new Error(`Failed to fetch posts: ${response.status}`);
		}

		const posts: Post[] = await response.json();

		return {
			posts,
			error: null,
			healthDown,
			mockDown,
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
			healthDown,
			mockDown,
			seo: {
				title: 'Explore',
				description: 'Browse posts and updates from the Solar Network community.'
			}
		};
	}
};
