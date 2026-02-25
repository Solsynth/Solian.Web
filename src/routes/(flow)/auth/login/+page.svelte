<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import LoginLookup from '$lib/components/login/LoginLookup.svelte';
	import LoginPicker from '$lib/components/login/LoginPicker.svelte';
	import LoginCheck from '$lib/components/login/LoginCheck.svelte';
	import { Shield } from 'lucide-svelte';

	// Current step in login flow
	let step = $state<'lookup' | 'picker' | 'check'>('lookup');

	// Navigation handlers
	function goToPicker() {
		step = 'picker';
	}

	function goToCheck() {
		step = 'check';
	}

	function goBackToLookup() {
		auth.clearLoginFlow();
		step = 'lookup';
	}

	function goBackToPicker() {
		auth.selectFactor(null as any);
		step = 'picker';
	}

	function completeLogin() {
		auth.clearLoginFlow();
		goto('/');
	}

	// Redirect if already authenticated
	$effect(() => {
		if (auth.isAuthenticated && auth.user) {
			goto('/');
		}
	});

	$effect(() => {
		const requestedStep = $page.url.searchParams.get('step');
		if (requestedStep === 'picker' && auth.challenge) {
			step = 'picker';
		}
		if (requestedStep === 'check' && auth.selectedFactor) {
			step = 'check';
		}
	});
</script>

<svelte:head>
	<title>Login - Solar Network</title>
</svelte:head>

<div
	class="w-full max-w-4xl rounded-3xl border border-base-300/60 bg-base-100/90 shadow-2xl backdrop-blur-xl"
>
	<div class="grid md:grid-cols-[1fr_1.15fr]">
		<section
			class="rounded-t-3xl bg-linear-to-br from-primary/25 via-base-100 to-info/15 p-6 md:rounded-l-3xl md:rounded-tr-none md:p-8"
		>
			<div
				class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-content shadow-lg"
			>
				<Shield size={22} />
			</div>
			<p class="text-xs font-semibold tracking-[0.2em] text-base-content/65 uppercase">
				Secure Access
			</p>
			<h1 class="mt-2 text-3xl leading-tight font-black">Sign in to Solar Network</h1>
			<p class="mt-3 max-w-sm text-sm text-base-content/70">
				Multi-factor login with pass challenge flow and social providers.
			</p>
			<div class="mt-6 text-sm">
				No account?
				<a class="link font-semibold link-primary" href="/auth/create-account">Create one</a>
			</div>
		</section>

		<section class="p-6 md:p-8">
			{#if step === 'lookup'}
				<LoginLookup onNext={goToPicker} />
			{:else if step === 'picker'}
				<LoginPicker onNext={goToCheck} onBack={goBackToLookup} />
			{:else if step === 'check'}
				<LoginCheck onComplete={completeLogin} onBack={goBackToPicker} />
			{/if}
		</section>
	</div>
</div>
