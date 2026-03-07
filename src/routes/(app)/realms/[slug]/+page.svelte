<script lang="ts">
	import { page } from '$app/stores';
	import PostCard from '$lib/components/PostCard.svelte';
	import { getFileUrl } from '$lib/utils/files';
	import { apiClient } from '$lib/utils/api';
	import {
		Search,
		Image,
		MessageCircle,
		ArrowDownUp,
		ShieldCheck,
		Loader2,
		Users,
		UserPlus,
		Building2,
		Globe2,
		Lock
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import type { Post } from '$lib/types/post';

	let { data }: { data: PageData } = $props();

	let initialized = $state(false);
	let posts = $state<Post[]>([]);
	let error = $state<string | null>(null);
	let isLoading = $state(false);
	let isRefreshing = $state(false);
	let total = $state(0);
	let offset = $state(0);
	let hasMore = $state(false);

	let contentType = $state<'all' | 'posts' | 'articles'>('all');
	let includeReplies = $state<boolean | null>(null);
	let mediaOnly = $state(false);
	let orderDesc = $state(true);
	let query = $state('');

	let isJoining = $state(false);
	let isMember = $state(false);

	$effect(() => {
		if (initialized) return;
		posts = data.posts;
		error = data.error;
		total = data.total || data.posts.length;
		offset = data.posts.length;
		hasMore = data.posts.length >= data.initialTake && data.posts.length < total;
		initialized = true;
		checkMembership();
	});

	const realm = $derived(data.realm);
	const displayName = $derived(realm?.name || 'Unknown Realm');
	const avatarUrl = $derived(getFileUrl(realm?.picture?.id));
	const backgroundUrl = $derived(getFileUrl(realm?.background?.id));
	const realmRouteSlug = $derived(encodeURIComponent(realm?.slug || $page.params.slug || ''));

	function getInitials(name: string): string {
		return (
			name
				.split(/\s+/)
				.filter(Boolean)
				.map((part) => part[0]?.toUpperCase())
				.slice(0, 2)
				.join('') || '?'
		);
	}

	function cycleRepliesFilter() {
		if (includeReplies === null) includeReplies = true;
		else if (includeReplies === true) includeReplies = false;
		else includeReplies = null;
	}

	function buildFilterParams(currentOffset: number): URLSearchParams {
		const params = new URLSearchParams({
			offset: String(currentOffset),
			take: String(data.initialTake),
			orderDesc: String(orderDesc)
		});

		if (contentType === 'posts') params.set('type', '0');
		if (contentType === 'articles') params.set('type', '1');
		if (includeReplies !== null) params.set('replies', String(includeReplies));
		if (mediaOnly) params.set('media', 'true');
		if (query.trim()) params.set('query', query.trim());

		return params;
	}

	async function reloadWithFilters() {
		if (!realmRouteSlug) return;
		isLoading = true;
		isRefreshing = true;
		error = null;
		try {
			const params = buildFilterParams(0);
			const response = await fetch(`/api/realms/${realmRouteSlug}/posts?${params.toString()}`, {
				cache: 'no-store'
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || 'Failed to fetch posts');

			posts = result.posts || [];
			total = result.total || posts.length;
			offset = posts.length;
			hasMore = posts.length >= data.initialTake && posts.length < total;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load posts';
		} finally {
			isLoading = false;
			isRefreshing = false;
		}
	}

	async function loadMore() {
		if (!hasMore || isLoading || !realmRouteSlug) return;
		isLoading = true;
		error = null;
		try {
			const params = buildFilterParams(offset);
			const response = await fetch(`/api/realms/${realmRouteSlug}/posts?${params.toString()}`, {
				cache: 'no-store'
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || 'Failed to fetch posts');

			const more: Post[] = result.posts || [];
			posts = [...posts, ...more];
			offset += more.length;
			total = result.total || total;
			hasMore = posts.length < total && more.length > 0;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load more posts';
		} finally {
			isLoading = false;
		}
	}

	async function checkMembership() {
		if (!realm?.slug) return;
		try {
			await apiClient(`/passport/realms/${encodeURIComponent(realm.slug)}/members/me`);
			isMember = true;
		} catch {
			isMember = false;
		}
	}

	async function handleJoin() {
		if (!realm?.slug || isJoining || isMember) return;
		isJoining = true;
		try {
			await apiClient(`/passport/realms/${encodeURIComponent(realm.slug)}/members/me`, {
				method: 'POST'
			});
			isMember = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to join realm';
		} finally {
			isJoining = false;
		}
	}
</script>

{#if data.notFound}
	<div class="mx-auto max-w-2xl p-6">
		<div class="card">
			<div class="card-body items-center text-center">
				<Users class="text-base-content/50" size={40} />
				<h1 class="text-xl font-bold">Realm not found</h1>
				<p class="text-base-content/60">The realm you requested does not exist.</p>
			</div>
		</div>
	</div>
{:else if !realm}
	<div class="mx-auto max-w-2xl p-6">
		<div class="alert alert-error"><span>{data.error || 'Failed to load realm'}</span></div>
	</div>
{:else}
	<div class="mx-auto max-w-5xl">
		<section class="relative overflow-hidden border-b border-base-300">
			<div class="h-40 w-full bg-base-200 sm:h-52">
				{#if backgroundUrl}
					<img
						src={backgroundUrl}
						alt={`${displayName} background`}
						class="h-full w-full object-cover"
					/>
				{/if}
			</div>
			<div
				class="mx-auto -mt-16 flex max-w-5xl flex-col gap-4 px-4 pb-4 sm:-mt-14 sm:flex-row sm:items-end sm:px-6"
			>
				<div class="shrink-0">
					{#if avatarUrl}
						<div class="avatar">
							<div
								class="h-24 w-24 rounded-3xl ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:h-28 sm:w-28"
							>
								<img src={avatarUrl} alt={displayName} />
							</div>
						</div>
					{:else}
						<div class="avatar avatar-placeholder">
							<div
								class="h-24 w-24 rounded-3xl bg-primary text-primary-content ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:h-28 sm:w-28"
							>
								<span class="text-2xl font-semibold">{getInitials(displayName)}</span>
							</div>
						</div>
					{/if}
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2 pt-18">
						<h1 class="truncate text-2xl font-black sm:text-3xl">{displayName}</h1>
						{#if realm.verification}
							<span class="badge gap-1 badge-primary">
								<ShieldCheck size={12} />
								Verified
							</span>
						{/if}
					</div>
					<p class="truncate text-sm text-base-content/60">@{realm.slug}</p>
				</div>
				<div class="flex gap-3 text-sm">
					<div class="rounded-xl border border-base-300 bg-base-100 px-3 py-2">
						<div class="font-semibold">{total}</div>
						<div class="text-base-content/60">Posts</div>
					</div>
				</div>
			</div>
		</section>

		<div class="space-y-4 px-4 py-4 lg:px-6">
			<section class="space-y-4">
				<div class="card">
					<div class="card-body p-4">
						{#if realm.description}
							<p class="text-sm text-base-content/80">{realm.description}</p>
						{:else}
							<p class="text-sm text-base-content/60">No description yet.</p>
						{/if}
						<div class="flex flex-wrap gap-2 pt-1">
							<span class="badge gap-1 border-info/30 bg-info/15 text-info">
								{#if realm.is_community}
									<Users size={12} />
									Community
								{:else}
									<Building2 size={12} />
									Organization
								{/if}
							</span>
							<span
								class="badge gap-1 {realm.is_public
									? 'border-success/30 bg-success/15 text-success'
									: 'border-warning/30 bg-warning/20 text-warning'}"
							>
								{#if realm.is_public}
									<Globe2 size={12} />
									Public
								{:else}
									<Lock size={12} />
									Private
								{/if}
							</span>
						</div>
					</div>
				</div>

				{#if realm.verification}
					<div class="card">
						<div class="card-body p-4">
							<p class="text-sm font-semibold">{realm.verification.title || 'Verified realm'}</p>
							{#if realm.verification.description}
								<p class="text-sm text-base-content/70">{realm.verification.description}</p>
							{/if}
							{#if realm.verification.verified_by}
								<p class="text-xs text-base-content/60">By {realm.verification.verified_by}</p>
							{/if}
						</div>
					</div>
				{/if}

				{#if realm.is_public && !isMember}
					<button
						class="btn w-full btn-primary sm:w-auto"
						onclick={handleJoin}
						disabled={isJoining}
					>
						{#if isJoining}
							<Loader2 class="animate-spin" size={16} />
						{:else}
							<UserPlus size={16} />
						{/if}
						Join Realm
					</button>
				{/if}
			</section>

			<section class="space-y-4">
				<div class="card">
					<div class="card-body gap-4 p-4">
						{#if isRefreshing}
							<div class="mb-1 flex items-center gap-2 text-sm text-base-content/60">
								<Loader2 class="animate-spin" size={14} />
								Refreshing feed...
							</div>
						{/if}
						<div class="join w-full">
							<button
								class="btn join-item flex-1 {contentType === 'all'
									? 'btn-primary'
									: 'border-base-300 bg-base-100 text-base-content hover:bg-base-200'}"
								onclick={() => {
									contentType = 'all';
									reloadWithFilters();
								}}>All</button
							>
							<button
								class="btn join-item flex-1 {contentType === 'posts'
									? 'btn-primary'
									: 'border-base-300 bg-base-100 text-base-content hover:bg-base-200'}"
								onclick={() => {
									contentType = 'posts';
									reloadWithFilters();
								}}>Posts</button
							>
							<button
								class="btn join-item flex-1 {contentType === 'articles'
									? 'btn-primary'
									: 'border-base-300 bg-base-100 text-base-content hover:bg-base-200'}"
								onclick={() => {
									contentType = 'articles';
									reloadWithFilters();
								}}>Articles</button
							>
						</div>
						<div class="grid gap-2 sm:grid-cols-2">
							<button
								class="btn justify-start border-base-300 bg-base-100 text-base-content hover:bg-base-200"
								onclick={() => {
									cycleRepliesFilter();
									reloadWithFilters();
								}}
							>
								<MessageCircle size={14} />
								Replies:
								{includeReplies === null ? 'Auto' : includeReplies ? 'On' : 'Off'}
							</button>
							<button
								class="btn justify-start border-base-300 bg-base-100 text-base-content hover:bg-base-200"
								onclick={() => {
									mediaOnly = !mediaOnly;
									reloadWithFilters();
								}}
							>
								<Image size={14} />
								Media only: {mediaOnly ? 'On' : 'Off'}
							</button>
							<button
								class="btn justify-start border-base-300 bg-base-100 text-base-content hover:bg-base-200"
								onclick={() => {
									orderDesc = !orderDesc;
									reloadWithFilters();
								}}
							>
								<ArrowDownUp size={14} />
								Order: {orderDesc ? 'Newest' : 'Oldest'}
							</button>
							<div class="join">
								<input
									class="input-bordered input join-item w-full"
									placeholder="Search posts"
									bind:value={query}
									onkeydown={(e) => e.key === 'Enter' && reloadWithFilters()}
								/>
								<button class="btn join-item btn-primary" onclick={reloadWithFilters}
									><Search size={14} /></button
								>
							</div>
						</div>
					</div>
				</div>

				{#if error}
					<div class="alert alert-error"><span>{error}</span></div>
				{/if}

				{#if posts.length > 0}
					<div
						class="space-y-4 transition-opacity duration-200 {isRefreshing
							? 'opacity-60'
							: 'opacity-100'}"
					>
						{#each posts as post (post.id)}
							<PostCard {post} />
						{/each}
					</div>
					<div class="py-2 text-center">
						{#if hasMore}
							<button class="btn btn-outline" onclick={loadMore} disabled={isLoading}>
								{#if isLoading}
									<Loader2 class="animate-spin" size={16} />
								{/if}
								Load more
							</button>
						{:else}
							<p class="text-sm text-base-content/50">No more posts</p>
						{/if}
					</div>
				{:else if !error}
					<div
						class="rounded-xl border border-base-300 bg-base-100 p-8 text-center text-base-content/60"
					>
						No posts for this realm with current filters.
					</div>
				{/if}
			</section>
		</div>
	</div>
{/if}
