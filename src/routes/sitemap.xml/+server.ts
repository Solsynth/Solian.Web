import type { RequestHandler } from './$types';

const STATIC_PATHS = ['/', '/livestreams'];

function toUrlNode(origin: string, path: string): string {
	return `<url><loc>${origin}${path}</loc></url>`;
}

export const GET: RequestHandler = async ({ url }) => {
	const origin = url.origin;
	const urls = STATIC_PATHS.map((path) => toUrlNode(origin, path)).join('');
	const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
