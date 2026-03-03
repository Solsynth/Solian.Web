<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { getFileUrl } from '$lib/utils/files';
	import { apiClient } from '$lib/utils/api';
	import { Check, Loader2, Users, UserPlus, Building2, Globe2, Lock } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	$effect(() => {
		if (!auth.isAuthenticated) {
			const redirectUrl = $page.url.pathname + $page.url.search;
			goto(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
		}
	});

	let initialized = $state(false);
	let isJoining = $state(false);
	let isCheckingMembership = $state(false);
	let isMember = $state(false);
	let error = $state<string | null>(null);

	const realm = $derived(data.realm);
	const bgUrl = $derived(getFileUrl(realm?.background?.id));
	const avatarUrl = $derived(getFileUrl(realm?.picture?.id));

	function getInitials(name: string): string {
		return (
			name
				.split(/\s+/)
				.filter(Boolean)
				.map((part) => part[0]?.toUpperCase())
				.slice(0, 2)
				.join('') || '?'
		);
	}

	onMount(() => {
		if (!initialized) {
			error = data.error;
			initialized = true;
		}
		checkMembership();
	});

	async function checkMembership() {
		if (!realm?.slug || isCheckingMembership) return;
		isCheckingMembership = true;
		try {
			await apiClient(`/pass/realms/${encodeURIComponent(realm.slug)}/members/me`);
			isMember = true;
		} catch {
			isMember = false;
		} finally {
			isCheckingMembership = false;
		}
	}

	async function joinRealm() {
		if (!realm?.slug || isJoining) return;
		isJoining = true;
		error = null;
		try {
			await apiClient(`/pass/realms/${encodeURIComponent(realm.slug)}/members/me`, {
				method: 'POST'
			});
			isMember = true;
			goto(`/realms/${realm.slug}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to join realm';
		} finally {
			isJoining = false;
		}
	}
</script>

{#if data.notFound}
	<div
		class="w-full max-w-md rounded-3xl border border-base-300/70 bg-base-100/90 p-8 text-center shadow-2xl backdrop-blur-xl"
	>
		<Users class="mx-auto text-base-content/50" size={36} />
		<h1 class="mt-3 text-xl font-black">Realm not found</h1>
	</div>
{:else if !realm}
	<div
		class="w-full max-w-md rounded-3xl border border-base-300/70 bg-base-100/90 p-8 shadow-2xl backdrop-blur-xl"
	>
		<div class="alert alert-error"><span>{error || 'Failed to load invite'}</span></div>
	</div>
{:else}
	<div
		class="w-full max-w-lg overflow-hidden rounded-3xl border border-base-300/70 bg-base-100/95 shadow-2xl backdrop-blur-xl"
	>
		<div class="h-28 w-full bg-base-200">
			{#if bgUrl}
				<img src={bgUrl} alt={`${realm.name} background`} class="h-full w-full object-cover" />
			{/if}
		</div>
		<div class="p-6 md:p-8">
			<p class="mb-3 text-xs font-semibold tracking-[0.2em] text-base-content/60 uppercase">
				You're invited
			</p>
			<div class="mb-6 flex items-center gap-3">
				{#if avatarUrl}
					<div class="avatar">
						<div
							class="h-14 w-14 rounded-2xl ring ring-base-300 ring-offset-2 ring-offset-base-100"
						>
							<img src={avatarUrl} alt={realm.name} />
						</div>
					</div>
				{:else}
					<div class="avatar avatar-placeholder">
						<div
							class="h-14 w-14 rounded-2xl bg-primary text-primary-content ring ring-base-300 ring-offset-2 ring-offset-base-100"
						>
							<span class="text-base font-semibold">{getInitials(realm.name)}</span>
						</div>
					</div>
				{/if}
				<div class="min-w-0">
					<p class="text-sm text-base-content/60">Join the realm</p>
					<h1 class="truncate text-2xl font-black">{realm.name}</h1>
					<p class="truncate text-sm text-base-content/60">@{realm.slug}</p>
				</div>
			</div>

			{#if realm.description}
				<p class="mb-4 text-sm text-base-content/80">{realm.description}</p>
			{/if}

			<div class="mb-3 flex flex-wrap gap-2">
				<span class="badge gap-1 border-info/30 bg-info/15 text-info">
					{#if realm.is_community}
						<Users size={12} />
						Community
					{:else}
						<Building2 size={12} />
						Organization
					{/if}
				</span>
				<span
					class="badge gap-1 {realm.is_public
						? 'border-success/30 bg-success/15 text-success'
						: 'border-warning/30 bg-warning/20 text-warning'}"
				>
					{#if realm.is_public}
						<Globe2 size={12} />
						Public
					{:else}
						<Lock size={12} />
						Private
					{/if}
				</span>
			</div>

			{#if error}
				<div class="mb-4 alert alert-error"><span>{error}</span></div>
			{/if}

			{#if isMember}
				<button class="btn w-full btn-success" onclick={() => goto(`/realms/${realm.slug}`)}>
					<Check size={16} />
					Open Realm
				</button>
			{:else}
				<button
					class="btn w-full btn-primary"
					onclick={joinRealm}
					disabled={isJoining || isCheckingMembership}
				>
					{#if isJoining || isCheckingMembership}
						<Loader2 class="animate-spin" size={16} />
					{:else}
						<UserPlus size={16} />
					{/if}
					Join Realm
				</button>
			{/if}
		</div>
	</div>
{/if}
