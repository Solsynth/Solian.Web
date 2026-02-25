<script lang="ts">
	import { Lock, ChevronRight, Key, Mail, Eye, Clock, Globe, HelpCircle } from 'lucide-svelte';
	import { requestFactorCode } from '$lib/utils/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { FACTOR_TYPES } from '$lib/types/auth';

	interface Props {
		onNext: () => void;
		onBack: () => void;
	}

	let { onNext, onBack }: Props = $props();

	let isBusy = $state(false);
	let error = $state('');
	let selectedFactorId = $state<string | null>(null);

	const availableFactors = $derived(
		auth.factors.filter((f) => !auth.challenge?.blacklistFactors?.includes(f.id))
	);

	async function performGetFactorCode() {
		if (!selectedFactorId || !auth.challenge) return;

		isBusy = true;
		error = '';

		try {
			// Some factors return empty response (null) which is fine
			await requestFactorCode(auth.challenge.id, selectedFactorId);
			const factor = auth.factors.find((f) => f.id === selectedFactorId);
			if (factor) {
				auth.selectFactor(factor);
			}
			onNext();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to request code';
		} finally {
			isBusy = false;
		}
	}

	function getFactorIcon(type: number): string {
		return FACTOR_TYPES[type]?.icon || 'help-circle';
	}

	function getFactorLabel(type: number): string {
		return FACTOR_TYPES[type]?.label || 'Unknown';
	}

	function getFactorDescription(type: number): string {
		return FACTOR_TYPES[type]?.description || '';
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Header -->
	<div class="flex flex-col gap-2 pt-14">
		<h1 class="text-3xl font-black">Authentication</h1>
		{#if auth.challenge}
			<p class="text-sm text-base-content/70">
				Step {auth.loginStep + 1} of {auth.challenge.stepTotal}
				{#if auth.challenge.stepRemain > 1}
					· {auth.challenge.stepRemain} more to go
				{/if}
			</p>
		{/if}
	</div>

	<!-- Error display -->
	{#if error}
		<div class="alert-sm alert alert-error">
			<span>{error}</span>
		</div>
	{/if}

	<!-- Progress bar -->
	{#if auth.challenge}
		<progress class="progress w-full progress-primary" value={auth.loginProgress} max="1"
		></progress>
	{/if}

	<!-- Factors list -->
	<div class="card bg-base-200">
		<div class="card-body gap-2 p-2">
			{#each availableFactors as factor}
				<label
					class="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-base-300"
				>
					<input
						type="radio"
						name="factor"
						class="radio radio-primary"
						value={factor.id}
						bind:group={selectedFactorId}
						disabled={isBusy}
					/>
					<div class="flex flex-1 items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-base-100">
							<!-- Lucide icons based on factor type -->
							{#if factor.type === 0}
								<Key size={20} />
							{:else if factor.type === 1}
								<Mail size={20} />
							{:else if factor.type === 2}
								<Eye size={20} />
							{:else if factor.type === 3}
								<Clock size={20} />
							{:else if factor.type === 4}
								<Globe size={20} />
							{:else}
								<HelpCircle size={20} />
							{/if}
						</div>
						<div class="flex-1">
							<p class="font-medium">{getFactorLabel(factor.type)}</p>
							<p class="text-sm text-base-content/60">{getFactorDescription(factor.type)}</p>
						</div>
					</div>
				</label>
			{/each}
		</div>
	</div>

	<!-- Actions -->
	<div class="flex items-center justify-between pt-2">
		<button class="btn btn-ghost btn-sm" onclick={onBack} disabled={isBusy}> Back </button>
		<button
			class="btn btn-primary"
			onclick={performGetFactorCode}
			disabled={isBusy || !selectedFactorId}
		>
			{#if isBusy}
				<span class="loading loading-sm loading-spinner"></span>
			{/if}
			Next
			<ChevronRight size={18} />
		</button>
	</div>
</div>
