<script lang="ts">
	import { Lock, ChevronRight } from 'lucide-svelte';
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
		auth.factors.filter(f => !auth.challenge?.blacklistFactors?.includes(f.id))
	);

	async function performGetFactorCode() {
		if (!selectedFactorId || !auth.challenge) return;

		isBusy = true;
		error = '';

		try {
			// Some factors return empty response (null) which is fine
			await requestFactorCode(auth.challenge.id, selectedFactorId);
			const factor = auth.factors.find(f => f.id === selectedFactorId);
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
	<div class="flex flex-col gap-2">
		<div class="avatar placeholder w-fit">
			<div class="bg-primary text-primary-content w-12 h-12 rounded-full">
				<Lock size={24} />
			</div>
		</div>
		<h1 class="text-3xl font-black">Verify your identity</h1>
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
		<div class="alert alert-error alert-sm">
			<span>{error}</span>
		</div>
	{/if}

	<!-- Progress bar -->
	{#if auth.challenge}
		<progress class="progress progress-primary w-full" value={auth.loginProgress} max="1"></progress>
	{/if}

	<!-- Factors list -->
	<div class="card bg-base-200">
		<div class="card-body p-2 gap-2">
			{#each availableFactors as factor}
				<label class="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 cursor-pointer transition-colors">
					<input
						type="radio"
						name="factor"
						class="radio radio-primary"
						value={factor.id}
						bind:group={selectedFactorId}
						disabled={isBusy}
					/>
					<div class="flex items-center gap-3 flex-1">
						<div class="w-10 h-10 rounded-lg bg-base-100 flex items-center justify-center">
							<!-- Simple icon rendering based on type -->
							{#if factor.type === 0}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7a2 2 0 0 1 2 2v4"/><path d="M9 7a2 2 0 0 0-2 2v4"/><circle cx="12" cy="12" r="3"/></svg>
							{:else if factor.type === 1}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
							{:else if factor.type === 2}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
							{:else if factor.type === 3}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
							{:else if factor.type === 4}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
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
	<div class="flex justify-between items-center pt-2">
		<button
			class="btn btn-ghost btn-sm"
			onclick={onBack}
			disabled={isBusy}
		>
			Back
		</button>
		<button
			class="btn btn-primary"
			onclick={performGetFactorCode}
			disabled={isBusy || !selectedFactorId}
		>
			{#if isBusy}
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			Next
			<ChevronRight size={18} />
		</button>
	</div>
</div>
