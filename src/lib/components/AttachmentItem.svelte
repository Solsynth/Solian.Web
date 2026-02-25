<script lang="ts">
	import type { Post } from '$lib/types/post';
	import { getFileUrl } from '$lib/utils/files';

	interface Props {
		attachment: Post['attachments'][0];
		maxHeight?: string;
	}

	let { attachment, maxHeight = '96' }: Props = $props();

	function getAttachmentUrl(attachment: Post['attachments'][0], variant?: string): string {
		return attachment.url || getFileUrl(attachment.id) || '';
	}
</script>

{#if attachment.mime_type.startsWith('image/')}
	<img
		src={getAttachmentUrl(attachment)}
		alt={attachment.name}
		class="w-full object-cover"
		style="aspect-ratio: {attachment.file_meta?.ratio || 'auto'}"
		loading="lazy"
	/>
{:else if attachment.mime_type.startsWith('video/')}
	<div style="aspect-ratio: {attachment.file_meta?.ratio || 'auto'}">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			src={getAttachmentUrl(attachment)}
			controls
			class="h-auto max-h-{maxHeight} w-full object-cover"
			poster={attachment.has_thumbnail ? getAttachmentUrl(attachment!, 'thumbnail') : undefined}
		></video>
	</div>
{:else if attachment.mime_type.startsWith('audio/')}
	<div class="flex h-auto max-h-{maxHeight} w-full items-center justify-center bg-base-300 p-4">
		<div class="text-center">
			<div class="mb-2 text-sm font-medium">{attachment.name}</div>
			<audio src={getAttachmentUrl(attachment)} controls class="w-full"></audio>
		</div>
	</div>
{:else}
	<div class="flex h-auto max-h-{maxHeight} w-full items-center justify-center bg-base-300 p-4">
		<div class="text-center">
			<div class="mb-2 text-sm font-medium">{attachment.name}</div>
			<div class="text-xs text-base-content/60">File type: {attachment.mime_type || 'unknown'}</div>
			<a
				href={getAttachmentUrl(attachment)}
				download={attachment.name}
				class="btn mt-2 btn-sm btn-primary"
			>
				Download
			</a>
		</div>
	</div>
{/if}
