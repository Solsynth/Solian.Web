import { API_BASE_URL } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

const CHECK_TIMEOUT_MS = 30000;

export const GET: RequestHandler = async ({ fetch, url }) => {
	const mockDown = dev && url.searchParams.get('mock_down') === '1';
	if (mockDown) {
		return json({ mode: 'failover' as const });
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

	try {
		const response = await fetch(`${API_BASE_URL}/health`, {
			method: 'GET',
			cache: 'no-store',
			signal: controller.signal
		});

		if (response.ok) {
			return json({ mode: 'up' as const });
		}

		return json({ mode: 'failover' as const });
	} catch {
		return json({ mode: 'failover' as const });
	} finally {
		clearTimeout(timeout);
	}
};
