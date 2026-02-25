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
		Verified,
		Reply,
		ChevronDown,
		ChevronUp,
		Ellipsis,
		ArrowRight,
		Paperclip,
		Globe,
		Users,
		EyeOff,
		Lock,
		PenLine,
		BarChart3,
		Sparkles,
		AtSign,
		Forward
	} from 'lucide-svelte';

	interface Props {
		post: Post;
		isDetail?: boolean;
	}

	let { post, isDetail = false }: Props = $props();

	let avatarUrl = $derived(getFileUrl(post.publisher.picture?.id));
	let displayContent = $derived(post.is_truncated ? `${post.content}...` : post.content);
	let renderedContent = $derived(renderMarkdown(displayContent));
	let referencePost = $derived(post.replied_post ?? post.forwarded_post);
	let hasReference = $derived(Boolean(referencePost));
	let referenceIsReply = $derived(Boolean(post.replied_post));
	let referenceCollapsed = $state(false);
	let renderedReferenceContent = $derived(
		referencePost
			? renderMarkdown(
					referencePost.is_truncated ? `${referencePost.content}...` : referencePost.content
				)
			: ''
	);

	type VisibilityMeta = {
		label: string;
		tone: string;
	};

	function getAttachmentUrl(attachment: Post['attachments'][0]): string {
		return attachment.url || getFileUrl(attachment.id) || '';
	}

	function getVisibilityMeta(visibility: number): VisibilityMeta {
		switch (visibility) {
			case 1:
				return { label: 'Friends', tone: 'badge-info' };
			case 2:
				return { label: 'Unlisted', tone: 'badge-warning' };
			case 3:
				return { label: 'Private', tone: 'badge-neutral' };
			default:
				return { label: 'Public', tone: 'badge-success' };
		}
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

	function titleCase(value: string): string {
		return value
			.replace(/[_-]/g, ' ')
			.split(' ')
			.filter(Boolean)
			.map((part) => part[0].toUpperCase() + part.slice(1))
			.join(' ');
	}

	function getDisplayName(target: Post): string {
		return target.publisher.nick || target.publisher.name;
	}

	function getAvatarUrl(target: Post): string {
		return getFileUrl(target.publisher.picture?.id) || '';
	}

	let showMenu = $state(false);
	let Wrapper = $derived(isDetail ? 'div' : 'a');
	let wrapperProps = $derived(isDetail ? { href: undefined } : { href: `/posts/${post.id}` });
	let netScore = $derived(post.upvotes - post.downvotes);
	let visibilityMeta = $derived(getVisibilityMeta(post.visibility));
	let hasEdits = $derived(post.updated_at !== post.created_at);
	let sortedReactions = $derived(Object.entries(post.reactions_count).sort((a, b) => b[1] - a[1]));
	let topReaction = $derived(sortedReactions.length ? sortedReactions[0] : null);
</script>

<svelte:element this={Wrapper} class="block hover:no-underline" {...wrapperProps}>
	<article
		class="hover:border-base-400 card cursor-pointer border border-base-300 bg-base-100 transition-all"
	>
		<div class="card-body p-4">
			<!-- Reference Post (Parent, Twitter-style) -->
			{#if hasReference}
				<div class="mb-2">
					<button
						type="button"
						class="mb-2 flex w-full items-center gap-2 text-left text-sm font-medium text-base-content/65"
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							referenceCollapsed = !referenceCollapsed;
						}}
					>
						{#if referenceIsReply}
							<Reply class="h-4 w-4" />
							<span>Replying to</span>
						{:else}
							<Forward class="h-4 w-4" />
							<span>Forwarded</span>
						{/if}
						<span class="ml-auto text-xs">{referenceCollapsed ? 'Expand' : 'Collapse'}</span>
						{#if referenceCollapsed}
							<ChevronDown class="h-4 w-4 text-base-content/60" />
						{:else}
							<ChevronUp class="h-4 w-4 text-base-content/60" />
						{/if}
					</button>
					{#if !referenceCollapsed && referencePost}
						<div class="grid grid-cols-[40px_1fr] gap-3">
							<div class="relative flex justify-center">
								{#if getAvatarUrl(referencePost)}
									<div class="avatar">
										<div class="h-10 w-10 rounded-full">
											<img
												src={getAvatarUrl(referencePost)}
												alt={getDisplayName(referencePost)}
												class="h-full w-full rounded-full object-cover"
											/>
										</div>
									</div>
								{:else}
									<div class="avatar avatar-placeholder">
										<div class="h-10 w-10 rounded-full bg-primary text-primary-content">
											<span class="text-sm font-medium"
												>{getInitials(getDisplayName(referencePost))}</span
											>
										</div>
									</div>
								{/if}
								<div class="absolute top-10 bottom-[-10px] w-px bg-base-300/80"></div>
							</div>
							<div class="min-w-0 pb-2">
								<div class="flex items-center gap-2">
									<span class="truncate text-sm font-semibold">{getDisplayName(referencePost)}</span
									>
									<span class="truncate text-sm text-base-content/65"
										>@{referencePost.publisher.name}</span
									>
								</div>
								<div class="text-xs text-base-content/55">
									{formatDate(referencePost.published_at)}
								</div>
								{#if referencePost.content}
									<div class="prose prose-sm mt-2 max-w-none text-base-content/85">
										{@html renderedReferenceContent}
									</div>
								{/if}
								{#if referencePost.title || referencePost.description}
									<div class="mt-2 space-y-1">
										{#if referencePost.title}
											<div class="line-clamp-1 text-sm font-semibold">{referencePost.title}</div>
										{/if}
										{#if referencePost.description}
											<div class="line-clamp-2 text-xs text-base-content/75">
												{referencePost.description}
											</div>
										{/if}
									</div>
								{/if}
								{#if referencePost.is_truncated}
									<div
										class="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-base-300 bg-base-100/70 px-2 py-1 text-xs text-base-content/70 italic"
									>
										<Ellipsis class="h-3.5 w-3.5" />
										<span>Post truncated</span>
									</div>
								{/if}
								{#if referencePost.attachments.length > 0}
									<div class="mt-2 inline-flex items-center gap-1 text-xs text-base-content/70">
										<Paperclip class="h-3.5 w-3.5" />
										<span>{referencePost.attachments.length} attachment(s)</span>
									</div>
								{/if}
								{#if referencePost.attachments.length > 0}
									<div
										class="mt-2 grid gap-2 {referencePost.attachments.length > 1
											? 'grid-cols-2'
											: 'grid-cols-1'}"
									>
										{#each referencePost.attachments as attachment}
											<div class="relative overflow-hidden rounded-xl bg-base-200">
												<img
													src={getAttachmentUrl(attachment)}
													alt={attachment.name}
													class="h-auto max-h-80 w-full object-cover"
													loading="lazy"
												/>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}

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
						<span class="text-xs text-base-content/40"
							>{formatDate(post.published_at, isDetail)}</span
						>
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
						<div
							class="absolute top-full right-0 z-10 mt-1"
							role="menu"
							tabindex="-1"
							onclick={(e) => e.stopPropagation()}
							onkeydown={(e) => {
								if (e.key === 'Escape') {
									e.stopPropagation();
									showMenu = false;
								}
							}}
						>
							<ul class="menu w-40 rounded-box border border-base-300 bg-base-100 shadow-lg">
								<li>
									<button
										onclick={(e) => e.stopPropagation()}
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.stopPropagation();
												// Handle share action
											}
										}}><Share class="h-4 w-4" /> Share</button
									>
								</li>
								<li>
									<button
										onclick={(e) => e.stopPropagation()}
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.stopPropagation();
												// Handle copy link action
											}
										}}><Link class="h-4 w-4" /> Copy link</button
									>
								</li>
								<li>
									<button
										class="text-error"
										onclick={(e) => e.stopPropagation()}
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.stopPropagation();
												// Handle report action
											}
										}}><Flag class="h-4 w-4" /> Report</button
									>
								</li>
							</ul>
						</div>
					{/if}
				</div>
			</div>

			<!-- Content -->
			<div class="mt-3">
				{#if post.title}
					<h3 class="mb-2 text-lg font-semibold">{post.title}</h3>
				{/if}
				<div class="prose-xs prose max-w-none text-base-content/90">
					{@html renderedContent}
				</div>
				{#if post.is_truncated}
					<div
						class="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-base-300 bg-base-200/40 px-2 py-1 text-xs text-base-content/75 italic"
					>
						<Ellipsis class="h-3.5 w-3.5" />
						<span>Post truncated</span>
						{#if !isDetail}
							<ArrowRight class="h-3.5 w-3.5" />
						{/if}
					</div>
				{/if}
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
							{tag.name ?? '#' + tag.slug}
						</a>
					{/each}
				</div>
			{/if}

			<!-- Metadata -->
			<div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
				{#if post.visibility !== 0}
					<span class="badge badge-sm {visibilityMeta.tone}">
						{#if post.visibility === 0}
							<Globe class="h-3.5 w-3.5" />
						{:else if post.visibility === 1}
							<Users class="h-3.5 w-3.5" />
						{:else if post.visibility === 2}
							<EyeOff class="h-3.5 w-3.5" />
						{:else}
							<Lock class="h-3.5 w-3.5" />
						{/if}
						{visibilityMeta.label}
					</span>
				{/if}
				{#if hasEdits}
					<span class="badge badge-outline badge-sm">
						<PenLine class="h-3 w-3" />
						{formatDate(post.updated_at)} edited
					</span>
				{/if}
				{#if post.attachments.length > 0}
					<span class="badge badge-outline badge-sm">
						<Paperclip class="h-3 w-3" />
						{post.attachments.length}
					</span>
				{/if}
			</div>

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
					<span class="min-w-[1.5ch] text-center text-sm font-medium">{formatNumber(netScore)}</span
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
