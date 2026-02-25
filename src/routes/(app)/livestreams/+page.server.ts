import type { PageServerLoad } from './$types';
import { snakeToCamel } from '$lib/utils/case';

interface LivestreamListItem {
	id?: string;
	title?: string;
	description?: string;
	status?: string | number;
	viewerCount?: number;
	thumbnail?: { id?: string } | null;
	thumbnailId?: string | null;
	publisher?: {
		name?: string;
		nick?: string;
		picture?: { id?: string } | null;
	} | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isActiveLivestream(status: string | number | undefined): boolean {
	if (typeof status === 'number') return status === 1;
	if (typeof status === 'string') return status.toLowerCase() === 'active';
	return false;
}

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch('https://api.solian.app/sphere/livestreams?limit=100&offset=0');
		if (!response.ok) {
			throw new Error(`Failed to load livestreams (${response.status})`);
		}

		const raw = (await response.json()) as unknown;
		const rows = Array.isArray(raw)
			? raw
			: isRecord(raw) && Array.isArray(raw.items)
				? raw.items
				: [];

		const livestreams = rows
			.filter(isRecord)
			.map((entry) => snakeToCamel<LivestreamListItem>(entry))
			.filter((entry) => isActiveLivestream(entry.status) && Boolean(entry.id));

		return {
			livestreams,
			error: null as string | null
		};
	} catch (error) {
		return {
			livestreams: [] as LivestreamListItem[],
			error: error instanceof Error ? error.message : 'Failed to load livestreams.'
		};
	}
};
