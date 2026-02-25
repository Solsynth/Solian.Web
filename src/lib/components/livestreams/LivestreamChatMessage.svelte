<script lang="ts">
	import type { ChatMessage } from '$lib/types/livestream';
	import { Crown } from 'lucide-svelte';
	import { isSuperchatMessage } from '$lib/utils/livestream/chat';

	interface Props {
		message: ChatMessage;
	}

	let { message }: Props = $props();

	function readAmount(): number {
		const raw = message.metadata?.amount;
		if (typeof raw === 'number') return raw;
		if (typeof raw === 'string') return Number.parseFloat(raw) || 0;
		return 0;
	}

	function amountText(): string {
		const amount = readAmount();
		if (amount === Math.floor(amount)) return `${amount}`;
		return amount.toFixed(1);
	}

	function senderLabel(): string {
		return message.sender?.trim() || message.senderIdentity?.trim() || 'Unknown';
	}
</script>

{#if isSuperchatMessage(message)}
	<div class="rounded-xl border border-warning/30 bg-warning/15 px-2 py-1.5 text-sm">
		<div class="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-warning">
			<Crown class="h-3.5 w-3.5" />
			<span>{senderLabel()} awarded {amountText()} NSP</span>
		</div>
		{#if message.message.trim()}
			<div class="text-sm">{message.message}</div>
		{/if}
	</div>
{:else if message.messageType === 'systemJoin' || message.messageType === 'systemLeave'}
	<div class="text-center text-xs text-base-content/55">{message.message}</div>
{:else}
	<div class="rounded-lg bg-base-100 px-2 py-1.5 text-sm">
		<div class="text-xs text-base-content/60">{senderLabel()}</div>
		<div>{message.message}</div>
	</div>
{/if}
