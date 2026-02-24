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
		const url = getOidcLoginUrl(provider, deviceInfo.device_id as string, `${window.location.origin}/auth/callback`);
		window.location.href = url;
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
		<h1 class="text-3xl font-black">Welcome back</h1>
	</div>

	<!-- Error display -->
	{#if error}
		<div class="alert alert-error alert-sm">
			<span>{error}</span>
		</div>
	{/if}

	<!-- Username input -->
	<div class="form-control">
		<label class="label" for="username">
			<span class="label-text">Username or Email</span>
		</label>
		<input
			id="username"
			type="text"
			class="input input-bordered w-full"
			placeholder="Enter your username"
			autocomplete="username"
			disabled={isBusy}
			bind:value={username}
			onkeydown={(e) => e.key === 'Enter' && !isBusy && performNewTicket()}
		/>
		<label class="label" for="username">
			<span class="label-text-alt text-base-content/60">Enter your username or email address</span>
		</label>
	</div>

	<!-- Third party login -->
	<div class="flex items-center gap-2 py-2">
		<div class="divider flex-1"></div>
		<span class="text-xs text-base-content/60">or continue with</span>
		<div class="divider flex-1"></div>
	</div>

	<div class="flex gap-2 justify-center">
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

	<!-- Actions -->
	<div class="flex justify-between items-center pt-2">
		<button
			class="btn btn-ghost btn-sm text-base-content/60"
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
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			Next
			<ChevronRight size={18} />
		</button>
	</div>

	<!-- Terms -->
	<div class="text-right pt-4">
		<p class="text-xs text-base-content/60">
			By continuing, you agree to our
		</p>
		<a
			href="https://solsynth.dev/terms"
			target="_blank"
			class="link link-primary text-xs inline-flex items-center gap-1"
		>
			Terms of Service
			<ExternalLink size={10} />
		</a>
	</div>
</div>
