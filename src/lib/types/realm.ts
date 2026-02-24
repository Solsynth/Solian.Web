import type { FileAttachment } from './post';

export interface Realm {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	picture: FileAttachment | null;
	background: FileAttachment | null;
	is_public: boolean;
	is_community: boolean;
	verification: {
		type: number;
		title: string | null;
		description: string | null;
		verified_by: string | null;
	} | null;
}
