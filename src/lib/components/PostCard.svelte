<script lang="ts">
	import type { Post } from '$lib/types/post';
	import { getFileUrl } from '$lib/utils/files';
	import { renderMarkdown } from '$lib/utils/markdown';
	import { goto } from '$app/navigation';
	import {
		MessageCircle,
		Repeat2,
		ArrowBigUp,
		ArrowBigDown,
		MoreHorizontal,
		Share,
		Flag,
		Link,
		Verified
	} from 'lucide-svelte';

	interface Props {
		post: Post;
		isDetail?: boolean;
	}

	let { post, isDetail = false }: Props = $props();

	let avatarUrl = $derived(getFileUrl(post.publisher.picture?.id));
	let renderedContent = $derived(renderMarkdown(post.content));
	function getAttachmentUrl(attachment: Post['attachments'][0]): string {
		return attachment.url || getFileUrl(attachment.id) || '';
	}

	function formatNumber(num: number): string {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toString();
	}

	function formatDate(dateStr: string, isDetailMode: boolean = false): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (isDetailMode) {
			return date.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		}

		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m`;
		if (hours < 24) return `${hours}h`;
		if (days < 7) return `${days}d`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	let showMenu = $state(false);
	let Wrapper = $derived(isDetail ? 'div' : 'a');
	let wrapperProps = $derived(isDetail ? { href: undefined } : { href: `/posts/${post.id}` });
</script>

<svelte:element this={Wrapper} class="block hover:no-underline" {...wrapperProps}>
	<article
		class="hover:border-base-400 card cursor-pointer border border-base-300 bg-base-100 transition-all"
	>
		<div class="card-body p-4">
			<!-- Header -->
			<div class="flex items-start justify-between gap-3">
				<button
					type="button"
					class="flex items-center gap-3"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						goto(`/publishers/${post.publisher.name}`);
					}}
				>
					<!-- Avatar -->
					{#if avatarUrl}
						<div class="avatar">
							<div class="h-10 w-10 rounded-full">
								<img
									src={avatarUrl}
									alt={post.publisher.nick || post.publisher.name}
									class="h-full w-full rounded-full object-cover"
								/>
							</div>
						</div>
					{:else}
						<div class="avatar avatar-placeholder">
							<div class="h-10 w-10 rounded-full bg-primary text-primary-content">
								<span class="text-sm font-medium"
									>{getInitials(post.publisher.nick || post.publisher.name)}</span
								>
							</div>
						</div>
					{/if}

					<div class="flex flex-col items-start">
						<div class="flex items-center gap-1.5">
							<span class="text-base leading-tight font-semibold">
								{post.publisher.nick || post.publisher.name}
							</span>
							{#if post.publisher.verification}
								<Verified class="h-4 w-4 text-primary" />
							{/if}
							<span class="text-sm text-base-content/50">@{post.publisher.name}</span>
						</div>
						<span class="text-xs text-base-content/40">{formatDate(post.published_at, isDetail)}</span>
					</div>
				</button>

				<!-- Menu -->
				<div class="relative">
					<button
						class="btn btn-circle btn-ghost btn-sm"
						onclick={(e) => {
							e.stopPropagation();
							showMenu = !showMenu;
						}}
					>
						<MoreHorizontal class="h-5 w-5" />
					</button>
					{#if showMenu}
						<div class="absolute top-full right-0 z-10 mt-1" onclick={(e) => e.stopPropagation()}>
							<ul class="menu w-40 rounded-box border border-base-300 bg-base-100 shadow-lg">
								<li>
									<button onclick={(e) => e.stopPropagation()}
										><Share class="h-4 w-4" /> Share</button
									>
								</li>
								<li>
									<button onclick={(e) => e.stopPropagation()}
										><Link class="h-4 w-4" /> Copy link</button
									>
								</li>
								<li>
									<button class="text-error" onclick={(e) => e.stopPropagation()}
										><Flag class="h-4 w-4" /> Report</button
									>
								</li>
							</ul>
						</div>
					{/if}
				</div>
			</div>

			<!-- Replied to -->
			{#if post.replied_post}
				<div class="mt-2 ml-[52px] text-sm text-base-content/60">
					Replying to <span class="text-primary">@{post.replied_post.publisher.name}</span>
				</div>
			{/if}

			<!-- Content -->
			<div class="mt-3">
				{#if post.title}
					<h3 class="mb-2 text-lg font-semibold">{post.title}</h3>
				{/if}
				<div class="prose-xs prose max-w-none text-base-content/90">
					{@html renderedContent}
				</div>
			</div>

			<!-- Attachments -->
			{#if post.attachments.length > 0}
				<div class="mt-3 grid gap-2 {post.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}">
					{#each post.attachments as attachment}
						<div class="relative overflow-hidden rounded-xl bg-base-200">
							<img
								src={getAttachmentUrl(attachment)}
								alt={attachment.name}
								class="h-auto max-h-96 w-full object-cover"
								loading="lazy"
							/>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Tags -->
			{#if post.tags.length > 0}
				<div class="mt-3 flex flex-wrap gap-2">
					{#each post.tags as tag}
						<a
							href="/tag/{tag.slug}"
							class="badge badge-ghost badge-sm transition-colors hover:badge-primary"
						>
							{tag.name ?? '#'+tag.slug}
						</a>
					{/each}
				</div>
			{/if}

			<!-- Actions -->
			<div class="mt-4 flex items-center justify-between pt-3">
				<div class="flex items-center gap-1">
					<button
						class="btn gap-1.5 btn-ghost btn-sm hover:bg-primary/10 hover:text-primary"
						onclick={(e) => e.stopPropagation()}
					>
						<MessageCircle class="h-4 w-4" />
						<span class="text-xs">{formatNumber(post.replies_count)}</span>
					</button>
					<button
						class="btn gap-1.5 btn-ghost btn-sm hover:bg-success/10 hover:text-success"
						onclick={(e) => e.stopPropagation()}
					>
						<Repeat2 class="h-4 w-4" />
						<span class="text-xs">{formatNumber(post.boost_count)}</span>
					</button>
				</div>

				<div class="flex items-center gap-0.5 rounded-lg bg-base-200 p-0.5">
					<button
						class="btn px-2 btn-ghost btn-xs hover:bg-success/20 hover:text-success"
						onclick={(e) => e.stopPropagation()}
					>
						<ArrowBigUp class="h-5 w-5" />
					</button>
					<span class="min-w-[1.5ch] text-center text-sm font-medium"
						>{formatNumber(post.upvotes - post.downvotes)}</span
					>
					<button
						class="btn px-2 btn-ghost btn-xs hover:bg-error/20 hover:text-error"
						onclick={(e) => e.stopPropagation()}
					>
						<ArrowBigDown class="h-5 w-5" />
					</button>
				</div>
			</div>
		</div>
	</article>
</svelte:element>
