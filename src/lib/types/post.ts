export interface FileAttachment {
	id: string;
	name: string;
	url?: string;
	width: number | null;
	height: number | null;
	blurhash: string | null;
	mime_type: string;
}

export interface Profile {
	id: string;
	first_name: string | null;
	last_name: string | null;
	bio: string | null;
	picture: FileAttachment | null;
	background: FileAttachment | null;
}

export interface Account {
	id: string;
	name: string;
	nick: string | null;
	profile: Profile | null;
}

export interface Publisher {
	id: string;
	name: string;
	nick: string | null;
	bio: string | null;
	picture: FileAttachment | null;
	background: FileAttachment | null;
	verification: {
		type: number;
		title: string | null;
		description: string | null;
		verified_by: string | null;
	} | null;
	account: Account | null;
	created_at: string;
}

export interface Tag {
	id: string;
	slug: string;
	name: string;
}

export interface Post {
	id: string;
	title: string | null;
	description: string | null;
	content: string;
	content_type: number;
	published_at: string;
	visibility: number;
	boost_count: number;
	upvotes: number;
	downvotes: number;
	replies_count: number;
	reactions_count: Record<string, number>;
	reactions_made: Record<string, boolean> | null;
	views_unique: number;
	views_total: number;
	is_truncated: boolean;
	publisher: Publisher;
	attachments: FileAttachment[];
	tags: Tag[];
	replied_post: Post | null;
	forwarded_post: Post | null;
	resource_identifier: string;
	created_at: string;
	updated_at: string;
}
