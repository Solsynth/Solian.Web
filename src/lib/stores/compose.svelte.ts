import type { Post, FileAttachment, Publisher } from '$lib/types/post';

export interface ComposeAttachment {
	id: string;
	file: File;
	preview?: string;
	progress?: number;
}

export interface ComposeInitialState {
	title?: string;
	description?: string;
	content: string;
	visibility?: number;
	attachments?: FileAttachment[];
	replyingTo?: Post;
	forwardingTo?: Post;
}

export interface ComposeDraft {
	id: string;
	title: string;
	description: string;
	content: string;
	visibility: number;
	attachments: FileAttachment[];
	updatedAt: Date;
}

class ComposeStore {
	drafts = $state<Record<string, ComposeDraft>>({});
	publishers = $state<Publisher[]>([]);
	currentPublisher = $state<Publisher | null>(null);

	title = $state('');
	description = $state('');
	content = $state('');
	visibility = $state(0);
	attachments = $state<ComposeAttachment[]>([]);
	submitting = $state(false);

	originalPost = $state<Post | null>(null);
	replyingTo = $state<Post | undefined>(undefined);
	forwardingTo = $state<Post | undefined>(undefined);

	private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		if (typeof window !== 'undefined') {
			this.loadDraftsFromStorage();
		}
	}

	private loadDraftsFromStorage() {
		try {
			const saved = localStorage.getItem('compose_drafts');
			if (saved) {
				const parsed = JSON.parse(saved) as Record<string, ComposeDraft>;
				this.drafts = Object.fromEntries(
					Object.entries(parsed).map(([k, v]) => [k, { ...v, updatedAt: new Date(v.updatedAt) }])
				);
			}
		} catch (e) {
			console.error('Failed to load drafts:', e);
		}
	}

	private saveDraftsToStorage() {
		try {
			localStorage.setItem('compose_drafts', JSON.stringify(this.drafts));
		} catch (e) {
			console.error('Failed to save drafts:', e);
		}
	}

	get draftList(): ComposeDraft[] {
		return Object.values(this.drafts).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
	}

	get hasContent(): boolean {
		return (
			this.title.trim().length > 0 ||
			this.description.trim().length > 0 ||
			this.content.trim().length > 0 ||
			this.attachments.length > 0
		);
	}

	generateDraftId(): string {
		return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}

	saveDraft(draft: ComposeDraft) {
		this.drafts[draft.id] = draft;
		this.saveDraftsToStorage();
	}

	deleteDraft(id: string) {
		delete this.drafts[id];
		this.saveDraftsToStorage();
	}

	loadDraft(id: string): ComposeDraft | undefined {
		return this.drafts[id];
	}

	clearDrafts() {
		this.drafts = {};
		this.saveDraftsToStorage();
	}

	setPublishers(publishers: Publisher[]) {
		this.publishers = publishers;
		if (!this.currentPublisher && publishers.length > 0) {
			this.currentPublisher = publishers[0];
		}
	}

	setCurrentPublisher(publisher: Publisher) {
		this.currentPublisher = publisher;
	}

	initializeFromState(state: ComposeInitialState | null) {
		this.title = state?.title ?? '';
		this.description = state?.description ?? '';
		this.content = state?.content ?? '';
		this.visibility = state?.visibility ?? 0;
		this.replyingTo = state?.replyingTo;
		this.forwardingTo = state?.forwardingTo;
		this.attachments = [];
	}

	initializeFromPost(post: Post) {
		this.originalPost = post;
		this.title = post.title ?? '';
		this.description = post.description ?? '';
		this.content = post.content;
		this.visibility = post.visibility;
		this.replyingTo = post.replied_post ?? undefined;
		this.forwardingTo = post.forwarded_post ?? undefined;
		this.attachments = [];
	}

	startAutoSave(ref: { read: (provider: unknown) => ComposeStore }) {
		this.stopAutoSave();
		this.autoSaveTimer = setInterval(() => {
			if (this.hasContent && this.currentPublisher) {
				const draft: ComposeDraft = {
					id: this.originalPost?.id ?? this.generateDraftId(),
					title: this.title,
					description: this.description,
					content: this.content,
					visibility: this.visibility,
					attachments: [],
					updatedAt: new Date()
				};
				this.saveDraft(draft);
			}
		}, 10000);
	}

	stopAutoSave() {
		if (this.autoSaveTimer) {
			clearInterval(this.autoSaveTimer);
			this.autoSaveTimer = null;
		}
	}

	reset() {
		this.title = '';
		this.description = '';
		this.content = '';
		this.visibility = 0;
		this.attachments = [];
		this.submitting = false;
		this.originalPost = null;
		this.replyingTo = undefined;
		this.forwardingTo = undefined;
	}

	addAttachment(file: File) {
		const id = `attach_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
		const attachment: ComposeAttachment = { id, file };

		if (file.type.startsWith('image/')) {
			attachment.preview = URL.createObjectURL(file);
		}

		this.attachments = [...this.attachments, attachment];
	}

	removeAttachment(id: string) {
		const attachment = this.attachments.find((a) => a.id === id);
		if (attachment?.preview) {
			URL.revokeObjectURL(attachment.preview);
		}
		this.attachments = this.attachments.filter((a) => a.id !== id);
	}

	updateAttachmentProgress(id: string, progress: number) {
		this.attachments = this.attachments.map((a) => (a.id === id ? { ...a, progress } : a));
	}
}

export const compose = new ComposeStore();
