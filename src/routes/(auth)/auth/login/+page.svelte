<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import LoginLookup from '$lib/components/login/LoginLookup.svelte';
	import LoginPicker from '$lib/components/login/LoginPicker.svelte';
	import LoginCheck from '$lib/components/login/LoginCheck.svelte';

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
</script>

<svelte:head>
	<title>Login - Floating Island</title>
</svelte:head>

<div class="w-full max-w-md">
	<div class="card bg-base-100 shadow-2xl">
		<div class="card-body p-6 md:p-8">
			{#if step === 'lookup'}
				<LoginLookup onNext={goToPicker} />
			{:else if step === 'picker'}
				<LoginPicker onNext={goToCheck} onBack={goBackToLookup} />
			{:else if step === 'check'}
				<LoginCheck onComplete={completeLogin} onBack={goBackToPicker} />
			{/if}
		</div>
	</div>
</div>
