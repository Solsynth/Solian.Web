import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const username = params.name.startsWith('@') ? params.name.slice(1) : params.name;
	throw new Response(null, {
		status: 302,
		headers: {
			Location: `/accounts/${encodeURIComponent(username)}`
		}
	});
};
