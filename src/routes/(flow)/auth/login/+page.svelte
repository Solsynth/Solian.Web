<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import LoginEntrance from '$lib/components/login/LoginEntrance.svelte';
	import LoginFactorList from '$lib/components/login/LoginFactorList.svelte';
	import LoginAuthenticate from '$lib/components/login/LoginAuthenticate.svelte';
	import favicon from '$lib/assets/favicon.png';

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
		const redirectUrl = $page.url.searchParams.get('redirect');
		goto(redirectUrl || '/');
	}

	// Redirect if already authenticated
	$effect(() => {
		if (auth.isAuthenticated && auth.user) {
			goto('/');
		}
	});

	$effect(() => {
		const requestedStep = $page.url.searchParams.get('step');
		const challengeId = $page.url.searchParams.get('challenge');

		if (requestedStep === 'picker' && auth.challenge) {
			step = 'picker';
		}
		if (requestedStep === 'check' && auth.selectedFactor) {
			step = 'check';
		}

		// Set challenge ID in state if provided in URL
		if (challengeId && auth.challenge?.id !== challengeId) {
			// Find the challenge with matching ID from factors
			const matchingFactor = auth.factors.find((f) => f.id === challengeId);
			if (matchingFactor) {
				auth.selectFactor(matchingFactor);
			}
		}
	});
</script>

<svelte:head>
	<title>Login - Solar Network</title>
</svelte:head>

<div class="w-full max-w-4xl rounded-3xl shadow-2xl backdrop-blur-xl">
	<div class="grid md:grid-cols-[1fr_1.15fr]">
		<section
			class="flex flex-col justify-between rounded-t-3xl bg-base-100/50 p-6 backdrop-blur-2xl md:rounded-l-3xl md:rounded-tr-none md:p-8"
		>
			<div>
				<img src={favicon} alt="Solar Network" class="h-12 w-12 rounded-full" />
				<h1 class="mt-2 text-3xl leading-tight font-black">Sign in</h1>
				<p class="mt-3 max-w-sm text-sm text-base-content/70">
					Use your Solarpass account to login the Floating Island.
				</p>
			</div>
			<div class="mt-6 text-sm">
				No account?
				<a class="link font-semibold link-primary" href="/auth/create-account">Create one</a>
			</div>
		</section>

		<section class="rounded-r-2xl bg-base-100/90 p-6 md:p-8">
			{#if step === 'lookup'}
				<LoginEntrance onNext={goToPicker} />
			{:else if step === 'picker'}
				<LoginFactorList onNext={goToCheck} onBack={goBackToLookup} />
			{:else if step === 'check'}
				<LoginAuthenticate onComplete={completeLogin} onBack={goBackToPicker} />
			{/if}
		</section>
	</div>
</div>
