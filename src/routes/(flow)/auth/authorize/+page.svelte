<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { Check, Plug, X } from 'lucide-svelte';
	import { getAuthorizeClientInfo, submitAuthorizeDecision } from '$lib/utils/api';
	import { getFileUrl } from '$lib/utils/files';

	interface ClientInfo {
		clientName?: string;
		homeUri?: string;
		picture?: { id?: string };
		background?: { id?: string };
		scopes?: string[];
	}

	let isLoading = $state(true);
	let isAuthorizing = $state(false);
	let error = $state('');
	let clientInfo = $state<ClientInfo | null>(null);

	const backgroundUrl = $derived(getFileUrl(clientInfo?.background?.id));
	const avatarUrl = $derived(getFileUrl(clientInfo?.picture?.id));
	const requestedScopes = $derived(clientInfo?.scopes || []);

	$effect(() => {
		if (!auth.isAuthenticated) {
			const redirectUrl = $page.url.pathname + $page.url.search;
			goto(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
		}
	});

	onMount(async () => {
		try {
			const query = new URLSearchParams(window.location.search);
			clientInfo = await getAuthorizeClientInfo(query);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load app authorization request';
		} finally {
			isLoading = false;
		}
	});

	async function handleAuthorize(authorize: boolean) {
		isAuthorizing = true;
		error = '';
		try {
			const query = new URLSearchParams(window.location.search);
			const result = await submitAuthorizeDecision(query, authorize);
			if (result.redirectUri) {
				window.location.href = result.redirectUri;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to submit authorization decision';
		} finally {
			isAuthorizing = false;
		}
	}
</script>

<svelte:head>
	<title>Authorize Application - Solar Network</title>
</svelte:head>

{#if backgroundUrl}
	<div
		class="fixed inset-0 -z-10 bg-cover bg-center opacity-30 blur-sm"
		style={`background-image: url('${backgroundUrl}')`}
	></div>
{/if}

<div
	class="w-full max-w-2xl rounded-3xl border border-base-300/70 bg-base-100/85 p-6 shadow-2xl backdrop-blur-xl md:p-8"
>
	{#if isLoading}
		<div class="flex items-center justify-center py-16">
			<span class="loading loading-lg loading-spinner text-primary"></span>
		</div>
	{:else}
		<div class="mb-6 flex items-center gap-4">
			{#if avatarUrl}
				<div class="avatar">
					<div class="w-14 rounded-2xl">
						<img src={avatarUrl} alt="Client app icon" />
					</div>
				</div>
			{:else}
				<div class="avatar avatar-placeholder">
					<div class="h-14 w-14 rounded-2xl bg-primary/15 text-primary"><Plug size={24} /></div>
				</div>
			{/if}
			<div class="min-w-0">
				<h1 class="truncate text-2xl font-black">
					{clientInfo?.clientName || 'Unknown Application'}
				</h1>
				<p class="truncate text-sm text-base-content/70">
					wants access to your Solar Network account
				</p>
			</div>
		</div>

		{#if error}
			<div class="mb-4 alert alert-error"><span>{error}</span></div>
		{/if}

		<div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
			<p class="mb-3 text-sm font-semibold">Requested permissions</p>
			{#if requestedScopes.length > 0}
				<ul class="space-y-2 text-sm">
					{#each requestedScopes as scope}
						<li class="flex items-start gap-2">
							<Check size={16} class="mt-0.5 text-success" />
							<span>{scope}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-sm text-base-content/60">No explicit scopes provided.</p>
			{/if}
		</div>

		<div class="mt-6 grid grid-cols-2 gap-3">
			<button
				class="btn btn-primary"
				onclick={() => handleAuthorize(true)}
				disabled={isAuthorizing}
			>
				{#if isAuthorizing}
					<span class="loading loading-sm loading-spinner"></span>
				{:else}
					<Check size={16} />
				{/if}
				Authorize
			</button>
			<button
				class="btn btn-outline"
				onclick={() => handleAuthorize(false)}
				disabled={isAuthorizing}
			>
				<X size={16} />
				Deny
			</button>
		</div>
	{/if}
</div>
