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

	function awardTier(): 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'teal' {
		const amount = readAmount();
		if (amount >= 500) return 'red';
		if (amount >= 200) return 'orange';
		if (amount >= 100) return 'amber';
		if (amount >= 50) return 'green';
		if (amount >= 20) return 'blue';
		return 'teal';
	}

	function senderLabel(): string {
		return message.sender.nick?.trim() || message.senderName?.trim() || 'Unknown';
	}

	function senderInitial(): string {
		const name = senderLabel().trim();
		if (!name) return '?';
		return name[0].toUpperCase();
	}

	function avatarId(): string | null {
		const fromProfile = message.sender.profile?.picture?.id;
		if (fromProfile) return fromProfile;
		const fromMeta = message.metadata?.pictureId;
		return typeof fromMeta === 'string' ? fromMeta : null;
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

	function isJoinMessage(): boolean {
		return message.messageType === 'systemJoin';
	}
</script>

{#if isSuperchatMessage(message)}
	<div class={`award-message award-${awardTier()} rounded-xl text-sm`}>
		<div class="award-head">
			<div class="award-avatar">
				{#if avatarId()}
					<img
						src={getFileUrl(avatarId())}
						alt={`${senderLabel()} avatar`}
						class="h-full w-full rounded-full object-cover"
					/>
				{:else}
					<span>{senderInitial()}</span>
				{/if}
			</div>
			<div class="award-main">
				<div class="mb-0.5 flex items-center gap-1.5 text-xs font-semibold">
					<span>{senderLabel()}</span>
					<Crown class="h-3.5 w-3.5" />
				</div>
				<div class="award-amount">{amountText()} pts</div>
			</div>
		</div>
		{#if message.message.trim()}
			<div class="award-body text-sm">{message.message}</div>
		{/if}
	</div>
{:else if message.messageType === 'systemJoin' || message.messageType === 'systemLeave' || message.messageType === 'systemInfo'}
	<div
		class="rounded-md bg-base-300/40 px-2 py-1 text-xs text-base-content/80"
		class:text-left={isJoinMessage()}
		class:text-center={!isJoinMessage()}
	>
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

<style>
	.award-message {
		--award-name-color: #ffffff;
		--award-message-color: #ffffff;
		--award-head-bg: rgba(15, 118, 110, 0.96);
		--award-body-bg: rgba(94, 234, 212, 0.72);
		--award-body-text: #0f172a;
		border: 1px solid rgba(255, 255, 255, 0.28);
		overflow: hidden;
	}

	.award-message .award-body {
		color: var(--award-message-color);
	}

	.award-message .font-semibold,
	.award-message .award-amount {
		color: var(--award-name-color);
	}

	.award-head {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 8px 7px;
		background: var(--award-head-bg);
	}

	.award-main {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 0;
	}

	.award-avatar {
		width: 24px;
		height: 24px;
		border-radius: 9999px;
		display: grid;
		place-items: center;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.22);
		color: #ffffff;
		font-size: 11px;
		font-weight: 700;
		flex-shrink: 0;
	}

	.award-amount {
		font-size: 16px;
		font-weight: 800;
		line-height: 1.2;
	}

	.award-body {
		padding: 7px 8px 8px;
		background: var(--award-body-bg);
		color: var(--award-body-text);
	}

	.award-red {
		--award-head-bg: rgba(185, 28, 28, 0.96);
		--award-body-bg: rgba(248, 113, 113, 0.78);
		--award-body-text: #ffffff;
		background: linear-gradient(140deg, rgba(185, 28, 28, 0.94), rgba(239, 68, 68, 0.82));
	}

	.award-orange {
		--award-message-color: #0c0a09;
		--award-head-bg: rgba(194, 65, 12, 0.96);
		--award-body-bg: rgba(251, 146, 60, 0.78);
		--award-body-text: #0c0a09;
		background: linear-gradient(140deg, rgba(194, 65, 12, 0.94), rgba(251, 146, 60, 0.84));
	}

	.award-amber {
		--award-message-color: #0c0a09;
		--award-head-bg: rgba(180, 83, 9, 0.96);
		--award-body-bg: rgba(251, 191, 36, 0.78);
		--award-body-text: #0c0a09;
		background: linear-gradient(140deg, rgba(180, 83, 9, 0.94), rgba(251, 191, 36, 0.84));
	}

	.award-green {
		--award-head-bg: rgba(21, 128, 61, 0.96);
		--award-body-bg: rgba(74, 222, 128, 0.78);
		--award-body-text: #052e16;
		background: linear-gradient(140deg, rgba(21, 128, 61, 0.94), rgba(34, 197, 94, 0.84));
	}

	.award-blue {
		--award-head-bg: rgba(29, 78, 216, 0.96);
		--award-body-bg: rgba(96, 165, 250, 0.78);
		--award-body-text: #082f49;
		background: linear-gradient(140deg, rgba(29, 78, 216, 0.94), rgba(59, 130, 246, 0.84));
	}

	.award-teal {
		--award-message-color: #0f172a;
		--award-head-bg: rgba(15, 118, 110, 0.96);
		--award-body-bg: rgba(94, 234, 212, 0.72);
		--award-body-text: #0f172a;
		background: linear-gradient(140deg, rgba(13, 148, 136, 0.94), rgba(94, 234, 212, 0.82));
	}
</style>
