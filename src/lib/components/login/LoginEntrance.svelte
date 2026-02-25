<script lang="ts">
	import { Asterisk, Github, Chrome, Apple, ChevronRight, ExternalLink } from 'lucide-svelte';
	import { createChallenge, getFactors, getOidcLoginUrl } from '$lib/utils/api';
	import { auth, getDeviceInfo } from '$lib/stores/auth.svelte';

	let username = $state('');
	let isBusy = $state(false);
	let error = $state('');

	interface Props {
		onNext: () => void;
	}

	let { onNext }: Props = $props();

	async function performNewTicket() {
		if (!username.trim()) return;
		isBusy = true;
		error = '';

		try {
			const deviceInfo = await getDeviceInfo();
			const result = await createChallenge(username, deviceInfo);
			auth.setChallenge(result);

			// Get factors
			const factors = await getFactors(result.id);
			auth.setFactors(factors);

			onNext();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start login';
		} finally {
			isBusy = false;
		}
	}

	async function requestResetPassword() {
		if (!username.trim()) {
			error = 'Please enter your username first';
			return;
		}
		// For now, show alert. In real implementation, show captcha modal
		alert('Password reset would show captcha modal here');
	}

	async function withOidc(provider: string) {
		const deviceInfo = await getDeviceInfo();
		const url = getOidcLoginUrl(
			provider,
			deviceInfo.device_id as string,
			`${window.location.origin}/auth/callback`
		);
		window.location.href = url;
	}
</script>

<!-- Error display -->
{#if error}
	<div class="alert-sm alert alert-error">
		<span>{error}</span>
	</div>
{/if}

<div class="flex flex-col gap-4">
	<!-- Header -->
	<div class="pt-14">
		<h1 class="text-3xl font-black">Welcome back</h1>
	</div>

	<!-- Username input -->
	<fieldset class="fieldset">
		<legend class="fieldset-legend">Username or Email</legend>
		<input
			id="username"
			type="text"
			class="input w-full"
			placeholder="Enter your username"
			autocomplete="username"
			disabled={isBusy}
			bind:value={username}
			onkeydown={(e) => e.key === 'Enter' && !isBusy && performNewTicket()}
		/>
	</fieldset>

	<!-- Third party login -->
	<div class="flex justify-end items-center py-2">

		<div class="flex justify-center gap-2">
			<button
				class="btn btn-circle btn-outline"
				onclick={() => withOidc('github')}
				disabled={isBusy}
				title="GitHub"
			>
				<Github size={18} />
			</button>
			<button
				class="btn btn-circle btn-outline"
				onclick={() => withOidc('google')}
				disabled={isBusy}
				title="Google"
			>
				<Chrome size={18} />
			</button>
			<button
				class="btn btn-circle btn-outline"
				onclick={() => alert('Apple Sign In requires mobile app')}
				disabled={isBusy}
				title="Apple"
			>
				<Apple size={18} />
			</button>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex items-center justify-between pt-2">
		<button
			class="btn text-base-content/60 btn-ghost btn-sm"
			onclick={requestResetPassword}
			disabled={isBusy}
		>
			Forgot password?
		</button>
		<button
			class="btn btn-primary"
			onclick={performNewTicket}
			disabled={isBusy || !username.trim()}
		>
			{#if isBusy}
				<span class="loading loading-sm loading-spinner"></span>
			{/if}
			Next
			<ChevronRight size={18} />
		</button>
	</div>

	<!-- Terms -->
	<div class="pt-4 text-right">
		<p class="text-xs text-base-content/60">By continuing, you agree to our</p>
		<a
			href="https://solsynth.dev/terms"
			target="_blank"
			class="inline-flex link items-center gap-1 text-xs link-primary"
		>
			Terms of Service
			<ExternalLink size={10} />
		</a>
	</div>
</div>
