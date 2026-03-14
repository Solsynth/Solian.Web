<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { CheckCircle2, Loader2 } from 'lucide-svelte';

	let destination = $derived($page.url.searchParams.get('redirect') || '/');

	onMount(() => {
		const timer = window.setTimeout(() => {
			goto(destination, { replaceState: true });
		}, 1400);

		return () => window.clearTimeout(timer);
	});
</script>

<svelte:head>
	<title>Sign-in Complete - Solar Network</title>
</svelte:head>

<div class="w-full max-w-md">
	<div class="card bg-base-100 shadow-2xl">
		<div class="card-body flex flex-col items-center p-8 text-center">
			<div class="flex flex-col items-center gap-4 py-6">
				<CheckCircle2 class="h-12 w-12 text-success" />
				<div>
					<h1 class="text-xl font-bold">Sign-in complete</h1>
					<p class="mt-1 text-base-content/70">You can head back into Floating Island now.</p>
				</div>
				<div class="mt-2 flex items-center gap-2 text-sm text-base-content/60">
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Redirecting you now...</span>
				</div>
				<a href={destination} class="btn btn-primary mt-2">Continue</a>
			</div>
		</div>
	</div>
</div>
