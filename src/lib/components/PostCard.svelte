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

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

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
</script>

<article
	class="card bg-base-100 border-base-300 hover:border-base-400 border transition-all cursor-pointer"
	onclick={() => !isDetail && goto(`/post/${post.id}`)}
>
	<div class="card-body p-4">
		<!-- Header -->
		<div class="flex items-start justify-between gap-3">
			<div class="flex items-center gap-3">
				<!-- Avatar -->
				<div class="avatar placeholder">
					<div class="bg-primary text-primary-content w-10 h-10 rounded-full">
						{#if avatarUrl}
							<img
								src={avatarUrl}
								alt={post.publisher.nick || post.publisher.name}
								class="w-full h-full object-cover rounded-full"
							/>
						{:else}
							<span class="text-sm font-medium">{getInitials(post.publisher.nick || post.publisher.name)}</span>
						{/if}
					</div>
				</div>

				<div class="flex flex-col">
					<div class="flex items-center gap-1.5">
						<span class="font-semibold text-base leading-tight">
							{post.publisher.nick || post.publisher.name}
						</span>
						{#if post.publisher.verification}
							<Verified class="w-4 h-4 text-primary" />
						{/if}
						<span class="text-base-content/50 text-sm">@{post.publisher.name}</span>
					</div>
					<span class="text-base-content/40 text-xs">{formatDate(post.published_at)}</span>
				</div>
			</div>

			<!-- Menu -->
			<div class="relative">
				<button
					class="btn btn-ghost btn-sm btn-circle"
					onclick={(e) => { e.stopPropagation(); showMenu = !showMenu; }}
				>
					<MoreHorizontal class="w-5 h-5" />
				</button>
				{#if showMenu}
					<div class="absolute right-0 top-full mt-1 z-10" onclick={(e) => e.stopPropagation()}>
						<ul class="menu bg-base-100 rounded-box shadow-lg border border-base-300 w-40">
							<li><button onclick={(e) => e.stopPropagation()}><Share class="w-4 h-4" /> Share</button></li>
							<li><button onclick={(e) => e.stopPropagation()}><Link class="w-4 h-4" /> Copy link</button></li>
							<li><button class="text-error" onclick={(e) => e.stopPropagation()}><Flag class="w-4 h-4" /> Report</button></li>
						</ul>
					</div>
				{/if}
			</div>
		</div>

		<!-- Replied to -->
		{#if post.replied_post}
			<div class="text-sm text-base-content/60 mt-2 ml-[52px]">
				Replying to <span class="text-primary">@{post.replied_post.publisher.name}</span>
			</div>
		{/if}

		<!-- Content -->
		<div class="mt-3">
			{#if post.title}
				<h3 class="text-lg font-semibold mb-2">{post.title}</h3>
			{/if}
			<div class="prose prose-xs max-w-none text-base-content/90">
				{@html renderedContent}
			</div>
		</div>

		<!-- Attachments -->
		{#if post.attachments.length > 0}
			<div class="mt-3 grid gap-2 {post.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}">
				{#each post.attachments as attachment}
					<div class="relative rounded-xl overflow-hidden bg-base-200">
						<img
							src={getAttachmentUrl(attachment)}
							alt={attachment.name}
							class="w-full h-auto max-h-96 object-cover"
							loading="lazy"
						/>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Tags -->
		{#if post.tags.length > 0}
			<div class="flex flex-wrap gap-2 mt-3">
				{#each post.tags as tag}
					<a href="/tag/{tag.slug}" class="badge badge-ghost badge-sm hover:badge-primary transition-colors">
						#{tag.name}
					</a>
				{/each}
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex items-center justify-between mt-4 pt-3">
			<div class="flex items-center gap-1">
				<button
					class="btn btn-ghost btn-sm gap-1.5 hover:bg-primary/10 hover:text-primary"
					onclick={(e) => e.stopPropagation()}
				>
					<MessageCircle class="w-4 h-4" />
					<span class="text-xs">{formatNumber(post.replies_count)}</span>
				</button>
				<button
					class="btn btn-ghost btn-sm gap-1.5 hover:bg-success/10 hover:text-success"
					onclick={(e) => e.stopPropagation()}
				>
					<Repeat2 class="w-4 h-4" />
					<span class="text-xs">{formatNumber(post.boost_count)}</span>
				</button>
			</div>

			<div class="flex items-center gap-0.5 bg-base-200 rounded-lg p-0.5">
				<button
					class="btn btn-ghost btn-xs hover:bg-success/20 hover:text-success px-2"
					onclick={(e) => e.stopPropagation()}
				>
					<ArrowBigUp class="w-5 h-5" />
				</button>
				<span class="text-sm font-medium min-w-[1.5ch] text-center">{formatNumber(post.upvotes - post.downvotes)}</span>
				<button
					class="btn btn-ghost btn-xs hover:bg-error/20 hover:text-error px-2"
					onclick={(e) => e.stopPropagation()}
				>
					<ArrowBigDown class="w-5 h-5" />
				</button>
			</div>
		</div>
	</div>
</article>
