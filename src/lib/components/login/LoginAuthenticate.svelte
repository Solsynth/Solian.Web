<script lang="ts">
	import {
		Asterisk,
		ChevronRight,
		Eye,
		EyeOff,
		Key,
		Mail,
		Eye as EyeIcon,
		Clock,
		Globe,
		HelpCircle
	} from 'lucide-svelte';
	import { verifyChallenge, getToken } from '$lib/utils/api';
	import { auth } from '$lib/stores/auth.svelte';
	import { FACTOR_TYPES } from '$lib/types/auth';
	import ConfuseSpinner from '../ConfuseSpinner.svelte';
	import toast from 'svelte-french-toast';

	interface Props {
		onComplete: () => void;
		onBack: () => void;
	}

	let { onComplete, onBack }: Props = $props();

	let isBusy = $state(false);
	let isFinalizing = $state(false);
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
			toast.error(`Failed to authenticate: ${err instanceof Error ? err.message : 'unknown error'}`);
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
		isFinalizing = true;
		isBusy = true;

		try {
			const tokenData = await getToken(code || auth.challenge.id);
			auth.setToken(tokenData.token);
			await auth.fetchUser();
			onComplete();
		} catch (err) {
			toast.error(`Failed to exchange token: ${err instanceof Error ? err.message : 'unknown error'}`);
			isBusy = false;
		}
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
			const allFilled = otpValues.every((v) => v.length === 1);
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
	<div class="pt-14">
		<h1 class="text-3xl font-black">
			{#if isFinalizing}
				Finalizing login
			{:else}
				Enter {isPasswordType ? 'password' : 'the code'}
			{/if}
		</h1>
	</div>

	<!-- Input area -->
	{#if isFinalizing}
		<div class="flex justify-center px-2 py-8">
			<ConfuseSpinner fontSize={24} />
		</div>
	{:else if isPasswordType}
		<!-- Password input -->
		<fieldset class="fieldset">
			<legend class="fieldset-legend">Password</legend>
			<div class="join w-full">
				<input
					id="password"
					type={showPassword ? 'text' : 'password'}
					class="input-bordered input join-item flex-1"
					placeholder="Enter your password"
					autocomplete="current-password"
					disabled={isBusy}
					bind:value={password}
					onkeydown={(e) => e.key === 'Enter' && !isBusy && performCheckTicket()}
				/>
				<button class="btn join-item" onclick={() => (showPassword = !showPassword)} type="button">
					{#if showPassword}
						<EyeOff size={18} />
					{:else}
						<Eye size={18} />
					{/if}
				</button>
			</div>
		</fieldset>
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
						class="input-bordered input h-14 w-12 text-center text-xl font-bold"
						value={otpValues[i]}
						disabled={isBusy}
						oninput={(e) => handleOtpInput(i, e.currentTarget.value)}
						onkeydown={(e) => handleOtpKeydown(i, e)}
					/>
				{/each}
			</div>
			<p class="text-center text-sm text-base-content/60">Enter the 6-digit code</p>
		</div>
	{/if}

	{#if auth.challenge && auth.challenge.stepRemain > 0 && !isFinalizing}
		<div class="px-1 pt-4">
			<p class="text-sm text-base-content/70">
				Step {auth.loginStep + 1} of {auth.challenge.stepTotal}
			</p>
			<!-- Progress bar -->
			<progress class="progress w-full progress-primary" value={auth.loginProgress} max="1"
			></progress>
		</div>
	{/if}

	<!-- Actions -->
	{#if auth.challenge?.stepRemain !== 0}
		<div class="flex items-center justify-between pt-2">
			<button class="btn btn-ghost btn-sm" onclick={onBack} disabled={isBusy}> Back </button>
			<button
				class="btn btn-primary"
				onclick={performCheckTicket}
				disabled={isBusy || (isPasswordType ? !password : otpValues.some((v) => !v))}
			>
				{#if isBusy}
					<span class="loading loading-sm loading-spinner"></span>
				{/if}
				Next
				<ChevronRight size={18} />
			</button>
		</div>
	{/if}
</div>
