<script lang="ts">
	import type { Post } from '$lib/types/post';
	import AttachmentItem from './AttachmentItem.svelte';

	interface Props {
		attachments: Post['attachments'];
		maxHeight?: string;
	}

	let { attachments, maxHeight = '96' }: Props = $props();

	let gridClass = $derived(attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1');
</script>

{#if attachments.length > 0}
	<div class="mt-3 grid gap-2 {gridClass}">
		{#each attachments as attachment}
			{#if attachment.mime_type.startsWith('image/')}
				<a
					href="/files/{attachment.id}"
					class="relative block overflow-hidden rounded-xl bg-base-200"
					onclick={(e) => e.stopPropagation()}
				>
					<AttachmentItem {attachment} {maxHeight} />
				</a>
			{:else}
				<div
					class="relative overflow-hidden rounded-xl bg-base-200"
					role="button"
					tabindex="0"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
				>
					<AttachmentItem {attachment} {maxHeight} />
				</div>
			{/if}
		{/each}
	</div>
{/if}
