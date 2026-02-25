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

<svelte:head>
	{#if data.post}
		<title>{data.post.publisher.nick || data.post.publisher.name} | Solar Network</title>
	{:else}
		<title>Post | Solar Network</title>
	{/if}
</svelte:head>

<!-- Header -->
<div class="sticky z-10 max-lg:top-14 lg:top-4 mb-4 lg:mb-6">
	<div class="max-w-2xl mx-auto lg:px-4">
		<div
			class="flex items-center gap-4 px-4 py-3 border-b border-base-300 bg-base-100/95 backdrop-blur lg:rounded-[2rem] lg:border lg:shadow-lg lg:shadow-base-content/5"
		>
			<button
				class="btn btn-ghost btn-sm btn-circle -ml-2"
				onclick={handleBack}
			>
				<ArrowLeft class="w-5 h-5" />
			</button>
			<div>
				<h1 class="text-lg font-bold">Post</h1>
				{#if data.post}
					<p class="text-xs text-base-content/50">{data.post.replies_count} replies</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<div class="max-w-2xl mx-auto lg:pt-1">
	{#if data.error}
		<div class="p-8 text-center">
			<div class="alert alert-error max-w-md mx-auto">
				<span>{data.error}</span>
			</div>
			<button class="btn btn-primary mt-4" onclick={() => goto('/')}>Back to Home</button>
		</div>
	{:else if data.post}
		<!-- Main Post -->
		<div class="p-4">
			<PostCard post={data.post} />
		</div>

		<!-- Replies Section -->
		{#if data.replies.length > 0}
			<div class="px-8 py-1 text-sm font-medium text-base-content/60 flex items-center gap-2">
				<MessageSquare class="w-4 h-4" />
				Replies ({data.replies.length})
			</div>
			<div class="flex flex-col gap-4 p-4">
				{#each data.replies as reply (reply.id)}
					<PostCard post={reply} />
				{/each}
			</div>
		{:else}
			<div class="p-8 text-center text-base-content/50">
				<p>No replies yet</p>
				<p class="text-sm mt-1">Be the first to reply</p>
			</div>
		{/if}
	{:else}
		<div class="flex items-center justify-center h-64">
			<Loader2 class="w-8 h-8 animate-spin text-primary" />
		</div>
	{/if}
</div>
