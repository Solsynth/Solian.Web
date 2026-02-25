<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';
	import { LoaderCircle } from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Post } from '$lib/types/post';

	let { data }: { data: PageData } = $props();

	// Infinite scroll state - use initial data
	let posts = $state<Post[]>([]);
	let isLoading = $state(false);
	let hasMore = $state(false);
	let error = $state<string | null>(null);
	let offset = $state(0);

	// Initialize from props once on mount
	$effect(() => {
		posts = data.posts;
		hasMore = data.posts.length === 20;
		error = data.error;
		offset = data.posts.length;
	});
	let loadMoreTrigger: HTMLDivElement | null = $state(null);

	async function loadMore() {
		if (isLoading || !hasMore) return;

		isLoading = true;
		error = null;

		try {
			const response = await fetch(`/api/posts?take=20&offset=${offset}`);
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to load more posts');
			}

			const newPosts: Post[] = result.posts;

			if (newPosts.length === 0) {
				hasMore = false;
			} else {
				posts = [...posts, ...newPosts];
				offset += newPosts.length;
				hasMore = newPosts.length === 20;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load more posts';
		} finally {
			isLoading = false;
		}
	}

	// Intersection Observer for auto-load on scroll
	$effect(() => {
		if (!loadMoreTrigger || !hasMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !isLoading) {
					loadMore();
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(loadMoreTrigger);

		return () => observer.disconnect();
	});
</script>

<div class="mx-auto max-w-2xl">
	<!-- Error State (Initial Load) -->
	{#if error && posts.length === 0}
		<div class="p-8 text-center">
			<div class="mx-auto alert max-w-md alert-error">
				<span>Failed to load posts: {error}</span>
			</div>
			<button class="btn mt-4 btn-primary" onclick={() => window.location.reload()}> Retry </button>
		</div>
	{/if}

	<!-- Feed -->
	{#if posts.length > 0}
		<div class="flex flex-col gap-4 p-4">
			{#each posts as post (post.id)}
				<PostCard {post} />
			{/each}
		</div>

		<!-- Load More Trigger / Button -->
		<div bind:this={loadMoreTrigger} class="p-6 text-center">
			{#if isLoading}
				<div class="flex items-center justify-center gap-2 text-base-content/60">
					<LoaderCircle class="h-5 w-5 animate-spin" />
					<span>Loading more...</span>
				</div>
			{:else if error && posts.length > 0}
				<div class="flex flex-col items-center gap-2">
					<span class="text-sm text-error">{error}</span>
					<button class="btn btn-sm btn-primary" onclick={loadMore}>Retry</button>
				</div>
			{:else if hasMore}
				<button class="btn btn-ghost btn-sm" onclick={loadMore}>Load more</button>
			{:else}
				<p class="text-sm text-base-content/40">No more posts</p>
			{/if}
		</div>
	{:else if !error}
		<div class="p-12 text-center text-base-content/50">
			<p class="mb-2 text-lg">No posts yet</p>
			<p>Be the first to post something!</p>
		</div>
	{/if}
</div>
