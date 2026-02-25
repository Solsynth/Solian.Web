<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { createAccount } from '$lib/utils/api';
	import CaptchaWidget from '$lib/components/CaptchaWidget.svelte';
	import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-svelte';

	type Stage = 'username-nick' | 'email' | 'password' | 'captcha' | 'terms';

	let stage = $state<Stage>('username-nick');
	let isLoading = $state(false);
	let error = $state('');

	let name = $state('');
	let nick = $state('');
	let email = $state('');
	let password = $state('');
	let language = $state('en-us');
	let captchaToken = $state('');

	const stepIndex = $derived(
		['username-nick', 'email', 'password', 'captcha', 'terms'].indexOf(stage) + 1
	);

	onMount(() => {
		language = navigator.language?.toLowerCase() || 'en-us';
		const tk = $page.url.searchParams.get('captcha_tk');
		if (tk) {
			captchaToken = tk;
			stage = 'terms';
		}
	});

	function validateCurrentStage(): string | null {
		if (stage === 'username-nick') {
			if (!/^[A-Za-z0-9_-]{2,256}$/.test(name)) {
				return 'Username must be 2-256 chars and contain only letters, numbers, _ or -.';
			}
			if (!nick.trim() || nick.length > 256) {
				return 'Nickname is required and must be at most 256 chars.';
			}
		}
		if (stage === 'email') {
			if (!email.trim() || email.includes('+') || !/.+@.+\..+/.test(email)) {
				return 'Please enter a valid email address (without + alias).';
			}
		}
		if (stage === 'password') {
			if (password.length < 4 || password.length > 128) {
				return 'Password length must be between 4 and 128 characters.';
			}
		}
		if (stage === 'captcha' && !captchaToken.trim()) {
			return 'Please complete captcha and get a token first.';
		}
		return null;
	}

	function next() {
		error = '';
		const validationError = validateCurrentStage();
		if (validationError) {
			error = validationError;
			return;
		}

		if (stage === 'username-nick') stage = 'email';
		else if (stage === 'email') stage = 'password';
		else if (stage === 'password') stage = 'captcha';
		else if (stage === 'captcha') stage = 'terms';
	}

	function back() {
		error = '';
		if (stage === 'email') stage = 'username-nick';
		else if (stage === 'password') stage = 'email';
		else if (stage === 'captcha') stage = 'password';
		else if (stage === 'terms') stage = 'captcha';
	}

	function onCaptchaVerified(token: string) {
		captchaToken = token;
		error = '';
		stage = 'terms';
	}

	async function submit() {
		error = '';
		if (!captchaToken.trim()) {
			error = 'Captcha token is required.';
			stage = 'captcha';
			return;
		}

		isLoading = true;
		try {
			await createAccount({
				name: name.trim(),
				nick: nick.trim(),
				email: email.trim(),
				password,
				language,
				captchaToken
			});
			await goto('/auth/login');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create account';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Create Account - Solar Network</title>
</svelte:head>

<div
	class="w-full max-w-3xl rounded-3xl border border-base-300/70 bg-base-100/85 shadow-2xl backdrop-blur-xl"
>
	<div class="grid md:grid-cols-[0.95fr_1.05fr]">
		<section
			class="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-primary/25 via-info/15 to-base-100 p-7 md:rounded-l-3xl md:rounded-tr-none md:p-9"
		>
			<div
				class="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-content shadow"
			>
				<ShieldCheck size={22} />
			</div>
			<p class="text-xs font-semibold tracking-[0.2em] text-base-content/70 uppercase">
				Step {stepIndex} / 5
			</p>
			<h1 class="mt-2 text-3xl leading-tight font-black">Create your account</h1>
			<p class="mt-3 text-sm text-base-content/70">
				Fast setup with username, email, password, captcha, and terms confirmation.
			</p>
		</section>

		<section class="p-6 md:p-9">
			{#if error}
				<div class="mb-4 alert alert-error"><span>{error}</span></div>
			{/if}

			{#if stage === 'username-nick'}
				<div class="space-y-4">
					<label class="form-control">
						<span class="label-text mb-1">Username</span>
						<input
							class="input-bordered input w-full"
							bind:value={name}
							placeholder="littlesheep"
						/>
					</label>
					<label class="form-control">
						<span class="label-text mb-1">Nickname</span>
						<input class="input-bordered input w-full" bind:value={nick} placeholder="ラムです" />
					</label>
				</div>
			{:else if stage === 'email'}
				<label class="form-control">
					<span class="label-text mb-1">Email</span>
					<input
						class="input-bordered input w-full"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
					/>
				</label>
			{:else if stage === 'password'}
				<label class="form-control">
					<span class="label-text mb-1">Password</span>
					<input
						class="input-bordered input w-full"
						type="password"
						bind:value={password}
						placeholder="At least 4 characters"
					/>
				</label>
			{:else if stage === 'captcha'}
				<div class="space-y-3">
					<p class="text-sm text-base-content/70">Complete captcha to continue.</p>
					<CaptchaWidget onVerified={onCaptchaVerified} />
					{#if captchaToken}
						<p class="text-xs text-success">Captcha verified successfully.</p>
					{/if}
				</div>
			{:else if stage === 'terms'}
				<div
					class="rounded-xl border border-base-300 bg-base-200/60 p-4 text-sm text-base-content/80"
				>
					<ul class="list-disc space-y-1 pl-5">
						<li>One account per person under Solar Network terms.</li>
						<li>Activate your account via email before full access.</li>
						<li>Support: lily@solsynth.dev</li>
					</ul>
				</div>
			{/if}

			<div class="mt-6 flex items-center justify-between">
				{#if stage === 'username-nick'}
					<a href="/auth/login" class="btn btn-ghost btn-sm">Login</a>
				{:else}
					<button class="btn btn-ghost btn-sm" onclick={back} disabled={isLoading}>
						<ArrowLeft size={16} /> Back
					</button>
				{/if}

				{#if stage !== 'terms'}
					<button class="btn btn-primary" onclick={next} disabled={isLoading}>
						Next <ArrowRight size={16} />
					</button>
				{:else}
					<button class="btn btn-primary" onclick={submit} disabled={isLoading}>
						{#if isLoading}
							<span class="loading loading-sm loading-spinner"></span>
						{:else}
							<CheckCircle2 size={16} />
						{/if}
						Create Account
					</button>
				{/if}
			</div>
		</section>
	</div>
</div>
