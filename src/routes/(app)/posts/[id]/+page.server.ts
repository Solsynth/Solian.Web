import type { PageServerLoad } from './$types';
import type { Post } from '$lib/types/post';
import { excerptText } from '$lib/seo';
import { getFileUrl } from '$lib/utils/files';
import { API_BASE_URL } from '$lib/utils/api';

export const load: PageServerLoad = async ({ fetch, params }) => {
	try {
		const response = await fetch(`${API_BASE_URL}/sphere/posts/${params.id}`);

		if (!response.ok) {
			if (response.status === 404) {
				return {
					post: null,
					replies: [],
					error: 'Post not found',
					seo: {
						title: 'Post not found',
						description: 'The requested post could not be found.',
						robots: 'noindex, nofollow'
					}
				};
			}
			throw new Error(`Failed to fetch post: ${response.status}`);
		}

		const post: Post = await response.json();

		// Fetch replies
		const repliesResponse = await fetch(
			`${API_BASE_URL}/sphere/posts/${params.id}/replies?take=50`
		);
		const replies: Post[] = repliesResponse.ok ? await repliesResponse.json() : [];
		const imageAttachment = post.attachments.find((item) => item.mime_type.startsWith('image/'));
		const publisherName = post.publisher.nick || post.publisher.name;
		const description = excerptText(
			post.description || post.title || post.content || `${publisherName}'s post on Solar Network.`
		);

		return {
			post,
			replies,
			error: null,
			seo: {
				title: post.title || `Post by ${publisherName}`,
				description,
				type: 'article',
				image: getFileUrl(imageAttachment?.id)
			}
		};
	} catch (error) {
		console.error('Error fetching post:', error);
		return {
			post: null,
			replies: [],
			error: error instanceof Error ? error.message : 'Failed to load post',
			seo: {
				title: 'Post',
				description: 'Read posts and community conversations on Solar Network.'
			}
		};
	}
};
