import type { PageServerLoad } from './$types';
import { getFileUrl } from '$lib/utils/files';

export const load: PageServerLoad = async ({ params }) => {
	const fileId = params.id;
	const fileUrl = getFileUrl(fileId);

	return {
		fileId,
		fileUrl,
		seo: {
			title: 'File',
			description: 'View file'
		}
	};
};
