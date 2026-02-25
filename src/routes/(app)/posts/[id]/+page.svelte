<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';
	import { ArrowLeft, Loader2, MessageSquare } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	function handleBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
			return;
		}
		goto('/');
	}
</script>

<!-- Header -->
<div class="sticky z-10 mb-4 max-lg:top-14 lg:top-4 lg:mb-6">
	<div class="mx-auto max-w-2xl lg:px-4">
		<div
			class="flex items-center gap-4 border-b border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur lg:-mx-3 lg:rounded-full lg:border lg:px-6 lg:shadow-lg lg:shadow-base-content/5"
		>
			<button class="btn -ml-2 btn-circle btn-ghost btn-sm" onclick={handleBack}>
				<ArrowLeft class="h-5 w-5" />
			</button>
			<div>
				<h1 class="text-lg font-bold">Post</h1>
			</div>
		</div>
	</div>
</div>

<div class="mx-auto max-w-2xl">
	{#if data.error}
		<div class="p-8 text-center">
			<div class="mx-auto alert max-w-md alert-error">
				<span>{data.error}</span>
			</div>
			<button class="btn mt-4 btn-primary" onclick={() => goto('/')}>Back to Home</button>
		</div>
	{:else if data.post}
		<!-- Main Post -->
		<div class="p-4">
			<PostCard post={data.post} />
		</div>

		<!-- Replies Section -->
		{#if data.replies.length > 0}
			<div class="flex items-center gap-2 px-8 py-1 text-sm font-medium text-base-content/60">
				<MessageSquare class="h-4 w-4" />
				Replies ({data.replies.length})
			</div>
			<div class="flex flex-col gap-4 p-4">
				{#each data.replies as reply (reply.id)}
					<PostCard post={reply} showReference={false} />
				{/each}
			</div>
		{:else}
			<div class="p-8 text-center text-base-content/50">
				<p>No replies yet</p>
				<p class="mt-1 text-sm">Be the first to reply</p>
			</div>
		{/if}
	{:else}
		<div class="flex h-64 items-center justify-center">
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
		</div>
	{/if}
</div>
