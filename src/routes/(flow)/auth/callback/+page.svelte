<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { Loader2, XCircle } from 'lucide-svelte';
	import { getFactors } from '$lib/utils/api';

	let error = $state('');
	let isProcessing = $state(true);

	onMount(async () => {
		const url = $page.url;
		const challengeId = url.searchParams.get('challenge');
		const token = url.searchParams.get('token');
		const errorParam = url.searchParams.get('error');

		if (errorParam) {
			error = decodeURIComponent(errorParam);
			isProcessing = false;
			return;
		}

		if (token) {
			// Direct token from OIDC
			try {
				auth.setToken(token);
				await auth.fetchUser();
				const redirectUrl = url.searchParams.get('redirect');
				const successTarget = redirectUrl
					? `/auth/success?redirect=${encodeURIComponent(redirectUrl)}`
					: '/auth/success';
				goto(successTarget);
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to authenticate';
				isProcessing = false;
			}
			return;
		}

		if (challengeId) {
			// Need to get factors and continue login flow
			try {
				const { apiClient } = await import('$lib/utils/api');
				const resp = await apiClient(`/padlock/auth/challenge/${challengeId}`);
				const challenge = await resp.json();
				auth.setChallenge(challenge);

				const factors = await getFactors(challengeId);
				auth.setFactors(factors);

				// Go to login page at picker step
				goto('/auth/login?step=picker');
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to get challenge';
				isProcessing = false;
			}
			return;
		}

		error = 'Invalid callback parameters';
		isProcessing = false;
	});
</script>

<svelte:head>
	<title>Authenticating... - Solar Network</title>
</svelte:head>

<div class="w-full max-w-md">
	<div class="card bg-base-100 shadow-2xl">
		<div class="card-body flex flex-col items-center p-8 text-center">
			{#if isProcessing}
				<div class="flex flex-col items-center gap-4 py-8">
					<Loader2 class="h-12 w-12 animate-spin text-primary" />
					<p class="text-lg font-medium">Completing authentication...</p>
				</div>
			{:else if error}
				<div class="flex flex-col items-center gap-4 py-4">
					<XCircle class="h-12 w-12 text-error" />
					<div>
						<h1 class="text-xl font-bold">Authentication Failed</h1>
						<p class="mt-1 text-base-content/70">{error}</p>
					</div>
					<a href="/auth/login" class="btn mt-2 btn-primary">Try Again</a>
				</div>
			{/if}
		</div>
	</div>
</div>
