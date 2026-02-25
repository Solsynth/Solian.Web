import { PUBLIC_FILE_BASE_URL } from '$env/static/public';

export function getFileUrl(fileId: string | null | undefined, variant?: string): string | null {
	if (!fileId) return null;
	const url = `${PUBLIC_FILE_BASE_URL}/${fileId}`;
	if (!variant) return url;
	return url + `?${variant}=true`;
}
