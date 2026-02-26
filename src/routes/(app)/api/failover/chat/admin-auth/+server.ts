import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface AuthBody {
	password?: string;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = (await request.json().catch(() => ({}))) as AuthBody;
	const password = (body.password || '').trim();

	const configuredPassword = (
		platform as
			| {
					env?: {
						FAILOVER_ADMIN_PASSWORD?: string;
					};
			  }
			| undefined
	)?.env?.FAILOVER_ADMIN_PASSWORD;

	if (!configuredPassword) {
		return json({ error: 'failover admin password is not configured' }, { status: 503 });
	}

	if (!password) {
		return json({ error: 'password is required' }, { status: 400 });
	}

	if (password !== configuredPassword) {
		return json({ ok: false }, { status: 401 });
	}

	return json(
		{ ok: true },
		{
			headers: {
				'Set-Cookie': 'failover_admin=1; Max-Age=600; Path=/api/failover/chat/ws; HttpOnly; SameSite=Lax'
			}
		}
	);
};
