import { PUBLIC_FILE_BASE_URL } from '$env/static/public';

export function getFileUrl(fileId: string | null | undefined): string | null {
	if (!fileId) return null;
	return `${PUBLIC_FILE_BASE_URL}/${fileId}`;
}
