<script lang="ts">
	import { page } from '$app/stores';
	import { Puzzle } from 'lucide-svelte';

	let token = $state('');
	let generated = $state('');

	function useToken(value: string) {
		const finalToken = value.trim();
		if (!finalToken) return;

		if (window.parent !== window) {
			window.parent.postMessage(`captcha_tk=${finalToken}`, '*');
		}

		const redirectUri = $page.url.searchParams.get('redirect_uri');
		if (redirectUri) {
			const url = new URL(redirectUri);
			url.searchParams.set('captcha_tk', finalToken);
			window.location.href = url.toString();
		}
	}

	function generateSampleToken() {
		generated = crypto.randomUUID().replaceAll('-', '');
		token = generated;
	}
</script>

<svelte:head>
	<title>Captcha Verification - Solar Network</title>
</svelte:head>

<div class="w-full max-w-lg rounded-3xl border border-base-300/70 bg-base-100/90 p-6 shadow-2xl backdrop-blur-xl">
	<div class="mb-4 flex items-center gap-3">
		<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
			<Puzzle size={20} />
		</div>
		<div>
			<h1 class="text-xl font-black">Solar Network Anti-Robot</h1>
			<p class="text-xs text-base-content/60">Captcha widget migration placeholder</p>
		</div>
	</div>

	<p class="mb-4 text-sm text-base-content/70">
		This route is ready for your final captcha provider component. For now, use a token to continue account flows.
	</p>

	<div class="space-y-3">
		<input class="input input-bordered w-full" bind:value={token} placeholder="Paste captcha token" />
		<div class="flex gap-2">
			<button class="btn btn-outline flex-1" onclick={generateSampleToken}>Generate Sample Token</button>
			<button class="btn btn-primary flex-1" onclick={() => useToken(token)}>Use Token</button>
		</div>
	</div>

	<p class="mt-5 text-xs text-base-content/60">
		Hosted by
		<a href="https://github.com/Solsynth/DysonNetwork" class="link link-primary" target="_blank" rel="noreferrer">DysonNetwork.Sphere</a>
	</p>
</div>
