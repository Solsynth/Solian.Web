<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';
	import { Loader2 } from 'lucide-svelte';
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

<svelte:head>
	<title>Home / Sphere</title>
</svelte:head>

<!-- Error State (Initial Load) -->
{#if error && posts.length === 0}
	<div class="p-8 text-center">
		<div class="alert alert-error max-w-md mx-auto">
			<span>Failed to load posts: {error}</span>
		</div>
		<button
			class="btn btn-primary mt-4"
			onclick={() => window.location.reload()}
		>
			Retry
		</button>
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
				<Loader2 class="w-5 h-5 animate-spin" />
				<span>Loading more...</span>
			</div>
		{:else if error && posts.length > 0}
			<div class="flex flex-col items-center gap-2">
				<span class="text-error text-sm">{error}</span>
				<button class="btn btn-sm btn-primary" onclick={loadMore}>Retry</button>
			</div>
		{:else if hasMore}
			<button class="btn btn-ghost btn-sm" onclick={loadMore}>Load more</button>
		{:else}
			<p class="text-base-content/40 text-sm">No more posts</p>
		{/if}
	</div>
{:else if !error}
	<div class="p-12 text-center text-base-content/50">
		<p class="text-lg mb-2">No posts yet</p>
		<p>Be the first to post something!</p>
	</div>
{/if}
