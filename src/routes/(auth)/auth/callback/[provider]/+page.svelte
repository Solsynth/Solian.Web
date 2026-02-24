<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/utils/api';
	import { Loader2 } from 'lucide-svelte';

	onMount(() => {
		const provider = $page.params.provider;
		const redirectUrl = `${API_BASE_URL}/pass/auth/callback/${provider}${$page.url.search}`;
		window.location.href = redirectUrl;
	});
</script>

<svelte:head>
	<title>Redirecting - Floating Island</title>
</svelte:head>

<div class="w-full max-w-md rounded-3xl border border-base-300/70 bg-base-100/90 p-8 text-center shadow-2xl backdrop-blur-xl">
	<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
		<Loader2 class="animate-spin" size={26} />
	</div>
	<h1 class="text-xl font-black">Almost There</h1>
	<p class="mt-2 text-sm text-base-content/70">Redirecting to provider callback...</p>
</div>
