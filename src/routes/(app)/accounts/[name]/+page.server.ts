import type { PageServerLoad } from './$types';
import { excerptText } from '$lib/seo';
import { getFileUrl } from '$lib/utils/files';
import { snakeToCamel } from '$lib/utils/case';
import { API_BASE_URL } from '$lib/utils/api';

interface AccountProfile {
	id: string;
	name: string;
	nick: string;
	language: string;
	region: string;
	activatedAt: string;
	isSuperuser: boolean;
	automatedId: string | null;
	profile: {
		id: string;
		firstName: string;
		middleName: string;
		lastName: string;
		bio: string;
		gender: string;
		pronouns: string;
		timeZone: string;
		location: string;
		links: Array<{
			name: string;
			url: string;
		}>;
		birthday: string | null;
		verification: {
			type: number;
			title: string;
			description: string;
			verifiedBy: string;
		} | null;
		experience: number;
		level: number;
		levelingProgress: number;
		socialCredits: number;
		socialCreditsLevel: number;
		picture: {
			id: string;
		} | null;
		background: {
			id: string;
		} | null;
		createdAt: string;
	};
	contacts: Array<{
		type: number;
		content: string;
		isPublic: boolean;
	}>;
	badges: Array<{
		id: string;
		type: string;
		label: string;
		caption: string | null;
		meta: Record<string, unknown>;
	}>;
	createdAt: string;
}

interface PageData {
	account: AccountProfile | null;
	posts: unknown[];
	error: string | null;
	notFound: boolean;
	total: number;
	initialTake: number;
	seo: {
		title: string;
		description: string;
		type?: string;
		image?: string;
		robots?: string;
	};
}

const TAKE = 20;

export const load: PageServerLoad = async ({ fetch, params, url }): Promise<PageData> => {
	const rawName = params.name || '';
	const username = rawName.startsWith('@') ? rawName.slice(1) : rawName;

	if (!username) {
		return {
			account: null,
			posts: [],
			error: 'Invalid account name',
			notFound: true,
			total: 0,
			initialTake: TAKE,
			seo: {
				title: 'Account not found',
				description: 'The requested account profile is invalid.',
				robots: 'noindex, nofollow'
			}
		};
	}

	try {
		const accountResponse = await fetch(
			`${API_BASE_URL}/pass/accounts/${encodeURIComponent(username)}`
		);

		if (!accountResponse.ok) {
			if (accountResponse.status === 404) {
				return {
					account: null,
					posts: [],
					error: null,
					notFound: true,
					total: 0,
					initialTake: TAKE,
					seo: {
						title: 'Account not found',
						description: 'The requested account profile does not exist.',
						robots: 'noindex, nofollow'
					}
				};
			}
			throw new Error(`Failed to fetch account: ${accountResponse.status}`);
		}

		const rawAccount = await accountResponse.json();
		const account = snakeToCamel<AccountProfile>(rawAccount);

		const displayName = account.nick || account.name;

		return {
			account,
			posts: [],
			error: null,
			notFound: false,
			total: 0,
			initialTake: TAKE,
			seo: {
				title: displayName,
				description: excerptText(
					account.profile?.bio || `View profile details for @${account.name}.`
				),
				type: 'profile',
				image: getFileUrl(account.profile?.picture?.id) || undefined
			}
		};
	} catch (error) {
		return {
			account: null,
			posts: [],
			error: error instanceof Error ? error.message : 'Failed to load account profile',
			notFound: false,
			total: 0,
			initialTake: TAKE,
			seo: {
				title: 'Account',
				description: 'Browse account profiles on Solar Network.'
			}
		};
	}
};
