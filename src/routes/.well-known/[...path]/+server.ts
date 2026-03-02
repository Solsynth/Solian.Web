import type { RequestHandler } from './$types';

const API_BASE = 'api.solian.app';

export const GET: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	url.hostname = API_BASE;
	return fetch(url.toString(), request);
};

export const POST: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	url.hostname = API_BASE;
	return fetch(url.toString(), request);
};

export const PUT: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	url.hostname = API_BASE;
	return fetch(url.toString(), request);
};

export const PATCH: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	url.hostname = API_BASE;
	return fetch(url.toString(), request);
};

export const DELETE: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	url.hostname = API_BASE;
	return fetch(url.toString(), request);
};

export const HEAD: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	url.hostname = API_BASE;
	return fetch(url.toString(), request);
};

export const OPTIONS: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	url.hostname = API_BASE;
	return fetch(url.toString(), request);
};
