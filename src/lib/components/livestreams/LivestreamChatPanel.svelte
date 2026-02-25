<script lang="ts">
	import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import LivestreamChatMessage from '$lib/components/livestreams/LivestreamChatMessage.svelte';
	import type { ChatMessage } from '$lib/types/livestream';

	interface Props {
		messages: ChatMessage[];
		collapsed?: boolean;
		onToggleCollapse?: () => void;
		onSend?: (value: string) => Promise<void> | void;
		onLoadHistory?: () => Promise<void> | void;
	}

	let { messages, collapsed = false, onToggleCollapse, onSend, onLoadHistory }: Props = $props();

	let inputValue = $state('');
	let hasLoadedHistory = $state(false);
	let chatContainer: HTMLDivElement | null = null;

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	onMount(() => {
		// Load chat history when the component mounts
		if (onLoadHistory && !hasLoadedHistory) {
			void onLoadHistory();
			hasLoadedHistory = true;
		}

		// Scroll to bottom when component mounts
		scrollToBottom();
	});

	$effect(() => {
		// Auto-scroll to bottom when messages change
		if (!collapsed && messages.length > 0) {
			scrollToBottom();
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

<div class="mt-3 rounded-xl border border-base-300 bg-base-200/25">
	<button
		type="button"
		class="flex w-full items-center gap-2 px-3 py-2 text-left"
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
			class="max-h-56 space-y-2 overflow-y-auto px-3 pb-2"
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
					<LivestreamChatMessage {message} />
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
