<script lang="ts">
	import { Asterisk, ChevronRight, Eye, EyeOff } from 'lucide-svelte';
	import { verifyChallenge, getToken } from '$lib/utils/api';
	import { auth, getDeviceInfo } from '$lib/stores/auth.svelte';
	import { FACTOR_TYPES } from '$lib/types/auth';

	interface Props {
		onComplete: () => void;
		onBack: () => void;
	}

	let { onComplete, onBack }: Props = $props();

	let isBusy = $state(false);
	let error = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let otpValues = $state(['', '', '', '', '', '']);

	const isPasswordType = $derived(auth.selectedFactor?.type === 0);
	const isOtpType = $derived(!isPasswordType);

	// Auto-complete if no steps remain
	$effect(() => {
		if (auth.challenge?.stepRemain === 0 && auth.challenge && !isBusy) {
			completeLogin();
		}
	});

	async function performCheckTicket() {
		if (!auth.challenge || !auth.selectedFactor) return;

		const pwd = isOtpType ? otpValues.join('') : password;
		if (!pwd) return;

		isBusy = true;
		error = '';

		try {
			const result = await verifyChallenge(auth.challenge.id, auth.selectedFactor.id, pwd);
			auth.setChallenge(result);

			if (result.stepRemain > 0) {
				// More steps needed - go back to picker
				auth.selectFactor(null as any);
				password = '';
				otpValues = ['', '', '', '', '', ''];
				onBack();
				return;
			}

			// All steps complete - get token
			await completeLogin(result.id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Verification failed';
			// Clear OTP on error
			if (isOtpType) {
				otpValues = ['', '', '', '', '', ''];
			}
		} finally {
			isBusy = false;
		}
	}

	async function completeLogin(code?: string) {
		if (!auth.challenge) return;
		isBusy = true;

		try {
			const tokenData = await getToken(code || auth.challenge.id);
			auth.setToken(tokenData.token);
			await auth.fetchUser();
			onComplete();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to get token';
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

	function handleOtpInput(index: number, value: string) {
		// Only allow single digit
		if (value.length > 1) value = value.slice(-1);
		if (value && !/^\d*$/.test(value)) return;

		otpValues[index] = value;

		// Auto-focus next input
		if (value && index < 5) {
			const nextInput = document.getElementById(`otp-${index + 1}`);
			nextInput?.focus();
		}

		// Auto-submit when all filled
		if (index === 5 && value) {
			const allFilled = otpValues.every(v => v.length === 1);
			if (allFilled) {
				performCheckTicket();
			}
		}
	}

	function handleOtpKeydown(index: number, e: KeyboardEvent) {
		if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
			const prevInput = document.getElementById(`otp-${index - 1}`);
			prevInput?.focus();
		}
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Header -->
	<div class="flex flex-col gap-2">
		<div class="avatar placeholder w-fit">
			<div class="bg-primary text-primary-content w-12 h-12 rounded-full">
				<Asterisk size={24} />
			</div>
		</div>
		<h1 class="text-3xl font-black">
			{#if auth.challenge?.stepRemain === 0}
				Logging you in...
			{:else}
				Enter {isPasswordType ? 'password' : 'code'}
			{/if}
		</h1>
		{#if auth.challenge && auth.challenge.stepRemain > 0}
			<p class="text-sm text-base-content/70">
				Step {auth.loginStep + 1} of {auth.challenge.stepTotal}
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
	{#if auth.challenge && auth.challenge.stepRemain > 0}
		<progress class="progress progress-primary w-full" value={auth.loginProgress} max="1"></progress>
	{/if}

	<!-- Input area -->
	{#if auth.challenge?.stepRemain === 0}
		<div class="flex justify-center py-8">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{:else if isPasswordType}
		<!-- Password input -->
		<div class="form-control">
			<label class="label" for="password">
				<span class="label-text">Password</span>
			</label>
			<div class="join w-full">
				<input
					id="password"
					type={showPassword ? 'text' : 'password'}
					class="input input-bordered join-item flex-1"
					placeholder="Enter your password"
					autocomplete="current-password"
					disabled={isBusy}
					bind:value={password}
					onkeydown={(e) => e.key === 'Enter' && !isBusy && performCheckTicket()}
				/>
				<button
					class="btn btn-outline join-item"
					onclick={() => showPassword = !showPassword}
					type="button"
				>
					{#if showPassword}
						<EyeOff size={18} />
					{:else}
						<Eye size={18} />
					{/if}
				</button>
			</div>
		</div>
	{:else}
		<!-- OTP input -->
		<div class="flex flex-col gap-3">
			<div class="flex justify-center gap-2">
				{#each otpValues as _, i}
					<input
						id="otp-{i}"
						type="text"
						inputmode="numeric"
						maxlength="1"
						class="input input-bordered w-12 h-14 text-center text-xl font-bold"
						value={otpValues[i]}
						disabled={isBusy}
						oninput={(e) => handleOtpInput(i, e.currentTarget.value)}
						onkeydown={(e) => handleOtpKeydown(i, e)}
					/>
				{/each}
			</div>
			<p class="text-center text-sm text-base-content/60">
				Enter the 6-digit code
			</p>
		</div>
	{/if}

	<!-- Factor info -->
	{#if auth.selectedFactor}
		<div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
			<div class="w-10 h-10 rounded-lg bg-base-100 flex items-center justify-center">
				{#if auth.selectedFactor.type === 0}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7a2 2 0 0 1 2 2v4"/><path d="M9 7a2 2 0 0 0-2 2v4"/><circle cx="12" cy="12" r="3"/></svg>
				{:else if auth.selectedFactor.type === 1}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
				{:else if auth.selectedFactor.type === 2}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
				{:else if auth.selectedFactor.type === 3}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
				{:else if auth.selectedFactor.type === 4}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
				{/if}
			</div>
			<div class="flex-1 min-w-0">
				<p class="font-medium truncate">{getFactorLabel(auth.selectedFactor.type)}</p>
				<p class="text-sm text-base-content/60 truncate">{getFactorDescription(auth.selectedFactor.type)}</p>
			</div>
		</div>
	{/if}

	<!-- Actions -->
	{#if auth.challenge?.stepRemain !== 0}
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
				onclick={performCheckTicket}
				disabled={isBusy || (isPasswordType ? !password : otpValues.some(v => !v))}
			>
				{#if isBusy}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Next
				<ChevronRight size={18} />
			</button>
		</div>
	{/if}
</div>
