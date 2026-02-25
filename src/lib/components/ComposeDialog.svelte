<script lang="ts">
	import { X, Settings, Upload, Loader2, FileText, AlertCircle } from 'lucide-svelte';
	import { compose, type ComposeInitialState } from '$lib/stores/compose.svelte';
	import type { Post, Publisher } from '$lib/types/post';
	import { goto } from '$app/navigation';
	import { API_BASE_URL } from '$lib/utils/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { publisherStore } from '$lib/stores/publisher.svelte';

	interface Props {
		open?: boolean;
		originalPost?: Post;
		initialState?: ComposeInitialState;
		onClose?: () => void;
		onSuccess?: () => void;
	}

	let { open = false, originalPost, initialState, onClose, onSuccess }: Props = $props();

	let showSettings = $state(false);
	let prompted = $state(false);
	let restoring = $state(false);
	let restoredState = $state<ComposeInitialState | null>(null);
	let publishers = $state<Publisher[]>([]);
	let selectedPublisher = $state<Publisher | null>(null);

	const isEditing = $derived(originalPost !== undefined);
	const isReply = $derived(
		initialState?.replyingTo !== undefined ||
			originalPost?.replied_post !== undefined ||
			compose.replyingTo !== undefined
	);
	const isForward = $derived(
		initialState?.forwardingTo !== undefined ||
			originalPost?.forwarded_post !== undefined ||
			compose.forwardingTo !== undefined
	);

	const canSubmit = $derived(
		!compose.submitting && compose.currentPublisher !== null && compose.content.trim().length > 0
	);

	$effect(() => {
		loadPublishers();

		const dialog = document.getElementById('compose-dialog') as HTMLDialogElement | null;
		if (open && dialog) {
			dialog.showModal();
			initializeCompose();
		} else if (!open && dialog?.open) {
			dialog.close();
		}
	});

	async function loadPublishers() {
		const data = await publisherStore.fetchPublishers();
		publishers = data;
		if (data.length > 0) {
			selectedPublisher = data[0];
			compose.currentPublisher = data[0];
		}
	}

	$effect(() => {
		compose.currentPublisher = selectedPublisher;
	});

	async function initializeCompose() {
		if (originalPost) {
			compose.initializeFromPost(originalPost);
		} else if (initialState) {
			compose.initializeFromState(initialState);
		} else {
			compose.initializeFromState(null);
			checkForDrafts();
		}
	}

	async function checkForDrafts() {
		if (
			!prompted &&
			compose.draftList.length > 0 &&
			!originalPost &&
			!initialState?.replyingTo &&
			!initialState?.forwardingTo
		) {
			prompted = true;
			await showRestoreDialog();
		}
	}

	async function showRestoreDialog() {
		const latestDraft = compose.draftList[0];
		if (!latestDraft) return;

		const shouldRestore = confirm(
			'You have an unsaved draft.\n\n' +
				`Title: ${latestDraft.title || '(no title)'}\n` +
				`Content: ${latestDraft.content.slice(0, 100)}...` +
				'\n\nWould you like to restore it?'
		);

		if (shouldRestore) {
			restoring = true;
			compose.deleteDraft(latestDraft.id);
			restoredState = {
				title: latestDraft.title,
				description: latestDraft.description,
				content: latestDraft.content,
				visibility: latestDraft.visibility,
				attachments: []
			};
			compose.initializeFromState(restoredState);
			restoring = false;
		}
	}

	function handleClose() {
		compose.stopAutoSave();

		if (compose.hasContent && !originalPost && !isReply && !isForward) {
			const draft = {
				id: compose.originalPost?.id ?? compose.generateDraftId(),
				title: compose.title,
				description: compose.description,
				content: compose.content,
				visibility: compose.visibility,
				attachments: [],
				updatedAt: new Date()
			};
			compose.saveDraft(draft);
		}

		compose.reset();
		onClose?.();
	}

	async function handleSubmit() {
		if (!canSubmit || !compose.currentPublisher) return;

		compose.submitting = true;

		try {
			const endpoint =
				isEditing && originalPost
					? `${API_BASE_URL}/sphere/posts/${originalPost.id}`
					: `${API_BASE_URL}/sphere/posts`;

			const body: Record<string, unknown> = {
				content: compose.content,
				visibility: compose.visibility,
				publisher_id: compose.currentPublisher.id
			};

			if (compose.title.trim()) {
				body.title = compose.title;
			}
			if (compose.description.trim()) {
				body.description = compose.description;
			}
			if (
				isReply &&
				(initialState?.replyingTo ?? originalPost?.replied_post ?? compose.replyingTo)
			) {
				body.replied_post_id = (
					initialState?.replyingTo ??
					originalPost?.replied_post ??
					compose.replyingTo
				)?.id;
			}
			if (
				isForward &&
				(initialState?.forwardingTo ?? originalPost?.forwarded_post ?? compose.forwardingTo)
			) {
				body.forwarded_post_id = (
					initialState?.forwardingTo ??
					originalPost?.forwarded_post ??
					compose.forwardingTo
				)?.id;
			}

			const response = await fetch(endpoint, {
				method: isEditing ? 'PATCH' : 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth.token?.token ?? ''}`
				},
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				throw new Error(`Failed to ${isEditing ? 'update' : 'publish'} post`);
			}

			if (!isEditing) {
				const draftId = compose.originalPost?.id ?? compose.generateDraftId();
				compose.deleteDraft(draftId);
			}

			compose.reset();
			onSuccess?.();
			handleClose();
			goto('/');
		} catch (error) {
			console.error('Failed to submit post:', error);
			alert(error instanceof Error ? error.message : 'Failed to publish post');
		} finally {
			compose.submitting = false;
		}
	}

	function handleSettings() {
		showSettings = !showSettings;
	}

	function getDialogTitle(): string {
		if (isEditing) return 'Edit Post';
		if (isReply) return 'Reply';
		if (isForward) return 'Forward';
		return 'New Post';
	}
</script>

<dialog id="compose-dialog" class="modal" onclose={() => handleClose()}>
	<div class="modal-box flex max-h-[90vh] max-w-2xl flex-col bg-base-200 p-0">
		<!-- Header -->
		<div class="flex items-center gap-3 border-b border-base-300 p-4">
			<button
				type="button"
				class="btn btn-circle btn-ghost btn-sm"
				onclick={() => (document.getElementById('compose-dialog') as HTMLDialogElement)?.close()}
			>
				<X class="h-5 w-5" />
			</button>

			<h2 class="flex-1 text-lg font-semibold">{getDialogTitle()}</h2>

			<div class="flex items-center gap-1">
				<button
					type="button"
					class="btn btn-circle btn-ghost btn-sm"
					onclick={handleSettings}
					title="Settings"
				>
					<Settings class="h-5 w-5" />
				</button>

				<button
					type="button"
					class="btn btn-circle btn-sm btn-primary"
					onclick={handleSubmit}
					disabled={!canSubmit}
					title={isEditing ? 'Update' : 'Publish'}
				>
					{#if compose.submitting}
						<Loader2 class="h-5 w-5 animate-spin" />
					{:else}
						<Upload class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Settings Panel -->
		{#if showSettings}
			<div class="border-b border-base-300 bg-base-200/30 p-4">
				<div class="space-y-4">
					<!-- Publisher Selector -->
					<div class="dropdown w-full">
						<label class="text-sm font-medium">Publisher</label>
						<select
							id="publisher-select"
							class="select-bordered select mt-1 w-full"
							bind:value={selectedPublisher}
						>
							{#each publishers as publisher}
								<option value={publisher}>
									{publisher.nick || publisher.name}
								</option>
							{/each}
							{#if publishers.length === 0}
								<option value={null} disabled>No publishers available</option>
							{/if}
						</select>
					</div>

					<!-- Visibility -->
					<div>
						<label class="text-sm font-medium" for="visibility-select">Visibility</label>
						<select
							id="visibility-select"
							class="select-bordered select mt-1 w-full"
							bind:value={compose.visibility}
						>
							<option value={0}>Public</option>
							<option value={1}>Friends</option>
							<option value={2}>Unlisted</option>
							<option value={3}>Private</option>
						</select>
					</div>
				</div>
			</div>
		{/if}

		<!-- Compose Content -->
		<div class="flex-1 space-y-4 overflow-y-auto p-4">
			<!-- Reply/Forward Reference -->
			{#if isReply || isForward}
				{@const refPost = isReply
					? (initialState?.replyingTo ?? originalPost?.replied_post ?? compose.replyingTo)
					: (initialState?.forwardingTo ?? originalPost?.forwarded_post ?? compose.forwardingTo)}
				{#if refPost}
					<div class="rounded-lg border border-base-300 bg-base-200/30 p-3">
						<div class="flex items-center gap-2 text-sm">
							{#if isReply}
								<AlertCircle class="h-4 w-4 text-primary" />
								<span class="font-medium">Replying to</span>
							{:else}
								<FileText class="h-4 w-4 text-primary" />
								<span class="font-medium">Forwarding from</span>
							{/if}
							<span class="text-base-content/70">@{refPost.publisher.name}</span>
						</div>
					</div>
				{/if}
			{/if}

			<!-- Title -->
			<input
				type="text"
				class="input w-full input-ghost text-lg font-semibold placeholder:text-base-content/40"
				placeholder="Title (optional)"
				bind:value={compose.title}
			/>

			<!-- Description -->
			<input
				type="text"
				class="input w-full input-ghost text-sm placeholder:text-base-content/40"
				placeholder="Description (optional)"
				bind:value={compose.description}
			/>

			<!-- Content -->
			<textarea
				class="textarea min-h-[150px] w-full resize-none textarea-ghost placeholder:text-base-content/40"
				placeholder="What's on your mind?"
				bind:value={compose.content}
			></textarea>
		</div>

		<!-- Footer -->
		<div class="flex items-center gap-2 border-t border-base-300 p-3">
			<span class="flex-1"></span>

			<!-- Character Count -->
			<span class="text-xs text-base-content/50">
				{compose.content.length} characters
			</span>
		</div>
	</div>

	<!-- Backdrop -->
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
