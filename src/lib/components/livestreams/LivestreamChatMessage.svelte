<script lang="ts">
	import type { ChatMessage } from '$lib/types/livestream';
	import { Crown } from 'lucide-svelte';
	import { isSuperchatMessage } from '$lib/utils/livestream/chat';
	import { getFileUrl } from '$lib/utils/files';

	interface Props {
		message: ChatMessage;
	}

	let { message }: Props = $props();

	const eventLabelMap: Record<string, string> = {
		stream_started: 'Stream Started',
		stream_ended: 'Stream Ended',
		pinned: 'Pinned',
		unpinned: 'Unpinned',
		follow: 'Follow',
		share: 'Share',
		like: 'Like',
		timeout: 'Timeout',
		muted: 'Muted',
		banned: 'Banned',
		warning: 'Warning',
		error: 'Error',
		announcement: 'Announcement'
	};

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
		return message.sender.nick?.trim() || message.senderName?.trim() || 'Unknown';
	}

	function systemEventLabel(): string {
		if (message.messageType === 'systemJoin') return 'Join';
		if (message.messageType === 'systemLeave') return 'Leave';
		const rawType = message.metadata?.eventType;
		if (typeof rawType === 'string') {
			const normalized = rawType.trim().toLowerCase().replaceAll('-', '_');
			return eventLabelMap[normalized] || normalized.replaceAll('_', ' ');
		}
		return 'System';
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
{:else if message.messageType === 'systemJoin' || message.messageType === 'systemLeave' || message.messageType === 'systemInfo'}
	<div class="rounded-md bg-base-300/40 px-2 py-1 text-center text-xs text-base-content/80">
		<span class="font-semibold">{systemEventLabel()}</span>
		<span class="mx-1">•</span>
		<span>{message.message}</span>
	</div>
{:else}
	<div class="rounded-lg border border-base-300/60 bg-base-100/90 px-2 py-1.5 text-sm">
		<div class="flex gap-2">
			<div class="avatar">
				<div class="h-6 w-6 rounded-full">
					{#if message.sender.profile?.picture != null}
						<img
							src={getFileUrl(message.sender.profile?.picture?.id)}
							alt={`${message.sender!.name} avatar`}
						/>
					{/if}
				</div>
			</div>
			<div>
				<div class="text-xs text-base-content/60">
					{senderLabel()} • {new Date(message.createdAt!).toLocaleTimeString()}
				</div>
				<div>{message.message}</div>
			</div>
		</div>
	</div>
{/if}
