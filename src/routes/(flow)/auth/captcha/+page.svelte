<script lang="ts">
	import { page } from '$app/stores';
	import { Puzzle } from 'lucide-svelte';
	import CaptchaWidget from '$lib/components/CaptchaWidget.svelte';

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

</script>

<svelte:head>
	<title>Captcha Verification - Solar Network</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg rounded-3xl border border-base-300/70 bg-base-100/90 p-6 text-center shadow-2xl backdrop-blur-xl">
	<div class="mb-4 flex flex-col items-center gap-3">
		<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
			<Puzzle size={20} />
		</div>
		<div>
			<h1 class="text-xl font-black">Solar Network Anti-Robot</h1>
			<p class="text-xs text-base-content/60">Complete verification to continue</p>
		</div>
	</div>

	<div class="my-4">
		<CaptchaWidget onVerified={useToken} />
	</div>

	<p class="mt-5 text-xs text-base-content/60">
		Hosted by
		<a href="https://github.com/Solsynth/DysonNetwork" class="link link-primary" target="_blank" rel="noreferrer">DysonNetwork.Sphere</a>
	</p>
</div>
