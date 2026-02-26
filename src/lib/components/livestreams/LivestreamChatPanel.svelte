<script lang="ts">
	import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { onMount, onDestroy, tick } from 'svelte';
	import LivestreamChatMessage from '$lib/components/livestreams/LivestreamChatMessage.svelte';
	import type { ChatMessage } from '$lib/types/livestream';

	interface Props {
		messages: ChatMessage[];
		collapsed?: boolean;
		maxHeight?: string;
		onToggleCollapse?: () => void;
		onSend?: (value: string) => Promise<void> | void;
		onLoadHistory?: () => Promise<void> | void;
	}

	let {
		messages,
		collapsed = false,
		maxHeight = 'max-h-56',
		onToggleCollapse,
		onSend,
		onLoadHistory
	}: Props = $props();

	let inputValue = $state('');
	let hasLoadedHistory = $state(false);
	let chatContainer: HTMLDivElement | null = $state(null);
	let enteringMessageIds: Set<string> = $state(new Set());
	let previousMessageCount = $state(0);
	let hasPrimedMessageCount = $state(false);

	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	function markMessageEntering(messageId: string) {
		enteringMessageIds = new Set(enteringMessageIds).add(messageId);
		window.setTimeout(() => {
			const nextIds = new Set(enteringMessageIds);
			nextIds.delete(messageId);
			enteringMessageIds = nextIds;
		}, 420);
	}

	onMount(() => {
		// Load chat history when the component mounts
		if (onLoadHistory && !hasLoadedHistory) {
			void onLoadHistory();
			hasLoadedHistory = true;
		}

		// Scroll to bottom when component mounts
		void scrollToBottom();
	});

	$effect(() => {
		const count = messages.length;
		if (!hasPrimedMessageCount) {
			hasPrimedMessageCount = true;
			previousMessageCount = count;
			return;
		}

		if (count > previousMessageCount) {
			for (const message of messages.slice(previousMessageCount)) {
				markMessageEntering(message.id);
			}
		}
		previousMessageCount = count;

		if (!collapsed && count > 0) {
			void scrollToBottom();
		}
	});

	onDestroy(() => {
		// Clean up any pending operations
	});

	async function submit() {
		const text = inputValue.trim();
		if (!text) return;
		await onSend?.(text);
		inputValue = '';
	}
</script>

<div class="chat-panel mt-3 rounded-xl border border-base-300/60 bg-base-300/25">
	<button
		type="button"
		class="flex w-full items-center gap-2 px-3 py-2 text-left text-base-content/90"
		onclick={onToggleCollapse}
	>
		<MessageCircle class="h-4 w-4" />
		<span class="text-sm font-medium">Live chat ({messages.length})</span>
		<span class="ml-auto">
			{#if collapsed}
				<ChevronDown class="h-4 w-4" />
			{:else}
				<ChevronUp class="h-4 w-4" />
			{/if}
		</span>
	</button>
	{#if !collapsed}
		<div
			bind:this={chatContainer}
			class="chat-scroll space-y-2 overflow-y-auto px-3 pb-2"
			style={`max-height: ${maxHeight}`}
			onscroll={(e) => {
				// Optional: handle manual scrolling if needed
				const target = e.currentTarget as HTMLDivElement;
				if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
					// User is near the bottom, ensure auto-scroll stays active
				}
			}}
		>
			{#if messages.length === 0}
				<div class="py-4 text-center text-xs text-base-content/60">No chat messages yet.</div>
			{:else}
				{#each messages as message (message.id)}
					<div class:message-enter={enteringMessageIds.has(message.id)}>
						<LivestreamChatMessage {message} />
					</div>
				{/each}
			{/if}
		</div>
		<div class="border-t border-base-300 p-2">
			<div class="flex items-center gap-2">
				<input
					type="text"
					class="input input-sm w-full"
					placeholder="Send a message..."
					bind:value={inputValue}
					onkeydown={(e) => {
						e.stopPropagation();
						if (e.key === 'Enter') {
							e.preventDefault();
							void submit();
						}
					}}
				/>
				<button
					type="button"
					class="btn btn-sm btn-primary"
					onclick={submit}
					disabled={!inputValue.trim()}
				>
					<Send class="h-4 w-4" />
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.chat-panel {
		backdrop-filter: blur(8px);
	}

	.chat-scroll {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.chat-scroll::-webkit-scrollbar {
		display: none;
	}

	.message-enter {
		animation: panel-message-slide-in 0.42s cubic-bezier(0.2, 0.75, 0.2, 1);
		will-change: transform, opacity, filter;
	}

	@keyframes panel-message-slide-in {
		from {
			opacity: 0;
			transform: translate3d(20px, 0, 0);
			filter: blur(4px);
		}
		to {
			opacity: 1;
			transform: translate3d(0, 0, 0);
			filter: blur(0);
		}
	}
</style>
