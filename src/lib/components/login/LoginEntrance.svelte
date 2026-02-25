<script lang="ts">
	import { Asterisk, Github, Chrome, Apple, ChevronRight, ExternalLink } from 'lucide-svelte';
	import { createChallenge, getFactors, getOidcLoginUrl } from '$lib/utils/api';
	import { auth, getDeviceInfo } from '$lib/stores/auth.svelte';
	import toast from 'svelte-french-toast';

	let username = $state('');
	let isBusy = $state(false);

	interface Props {
		onNext: () => void;
	}

	let { onNext }: Props = $props();

	async function performNewTicket() {
		if (!username.trim()) return;
		isBusy = true;

		try {
			const deviceInfo = await getDeviceInfo();
			const result = await createChallenge(username, deviceInfo);
			auth.setChallenge(result);

			// Get factors
			const factors = await getFactors(result.id);
			auth.setFactors(factors);

			onNext();
		} catch (err) {
			toast.error(`Failed to start a challenge: ${err instanceof Error ? err.message : 'unknown error'}`);
		} finally {
			isBusy = false;
		}
	}

	async function requestResetPassword() {
		if (!username.trim()) {
			toast.error('Please enter your username first');
			return;
		}
		// For now, show alert. In real implementation, show captcha modal
		toast.error('TODO');
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

<div class="flex flex-col gap-4">
	<!-- Header -->
	<div class="pt-14">
		<h1 class="text-3xl font-black">
			&#67;&#105;&#97;&#108;&#108;&#111;&#32;&#65374;&#40;&#8736;&#12539;&#969;&#60;&#32;&#41;&#8978;&#9733;
		</h1>
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
	<div class="flex items-center justify-end py-2">
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
