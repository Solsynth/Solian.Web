import { API_BASE_URL } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface PermissionResponse {
	allowed: boolean;
	available: boolean;
	reason: 'available' | 'owned' | 'taken';
}

function sanitizeUsername(value: string | null): string {
	if (!value) return '';
	return value.trim();
}

async function getAccountName(fetchFn: typeof fetch, authHeader: string | null): Promise<string | null> {
	if (!authHeader) return null;
	const response = await fetchFn(`${API_BASE_URL}/passport/accounts/me`, {
		headers: {
			Authorization: authHeader
		}
	});
	if (!response.ok) return null;

	const data = (await response.json()) as { name?: string };
	return typeof data.name === 'string' ? data.name : null;
}

export const GET: RequestHandler = async ({ fetch, request, url }) => {
	const name = sanitizeUsername(url.searchParams.get('name'));
	if (!name) {
		return json({ error: 'name is required' }, { status: 400 });
	}

	const response = await fetch(`${API_BASE_URL}/passport/accounts/${encodeURIComponent(name)}`);

	if (response.status === 404) {
		const payload: PermissionResponse = {
			allowed: true,
			available: true,
			reason: 'available'
		};
		return json(payload);
	}

	if (!response.ok) {
		return json({ error: 'failed to validate username' }, { status: 502 });
	}

	const authHeader = request.headers.get('authorization');
	const meName = await getAccountName(fetch, authHeader);

	if (meName && meName.toLowerCase() === name.toLowerCase()) {
		const payload: PermissionResponse = {
			allowed: true,
			available: false,
			reason: 'owned'
		};
		return json(payload);
	}

	const payload: PermissionResponse = {
		allowed: false,
		available: false,
		reason: 'taken'
	};
	return json(payload);
};
