import { createRequestHandler } from '@sveltejs/kit/cloudflare';

const API_BASE = 'api.solian.app';

let handler;

async function getHandler() {
	if (!handler) {
		handler = createRequestHandler({
			build: await import('./build/server/manifest.js')
		});
	}
	return handler;
}

export default {
	async fetch(request, env, context) {
		const url = new URL(request.url);

		if (url.pathname.startsWith('/.well-known/') || url.pathname.startsWith('/activitypub/')) {
			url.hostname = API_BASE;
			return fetch(url.toString(), request);
		}

		const fn = await getHandler();
		return fn(request, { env, context });
	}
};
