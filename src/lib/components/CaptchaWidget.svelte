<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { AlertTriangle } from 'lucide-svelte';
	import { getCaptchaConfig } from '$lib/utils/api';
	import ConfuseSpinner from './ConfuseSpinner.svelte';

	interface Props {
		provider?: string;
		apiKey?: string;
		onVerified: (token: string) => void;
	}

	let { provider = '', apiKey = '', onVerified }: Props = $props();

	let currentProvider = $state('');
	let currentApiKey = $state('');
	let isLoading = $state(true);
	let error = $state('');
	let captchaContainer: HTMLDivElement | undefined = $state(undefined);
	let widgetId: string | number | null = $state(null);

	type CaptchaWindow = Window & {
		turnstile?: {
			render: (container: HTMLElement, options: Record<string, unknown>) => string;
			remove?: (widgetId: string) => void;
		};
		hcaptcha?: {
			render: (container: HTMLElement, options: Record<string, unknown>) => number;
			remove?: (widgetId: number) => void;
		};
		grecaptcha?: {
			render: (container: HTMLElement, options: Record<string, unknown>) => number;
			reset?: (widgetId: number) => void;
		};
	};

	async function loadScript(src: string, id: string): Promise<void> {
		if (typeof window === 'undefined' || typeof document === 'undefined') return;

		const existing = document.getElementById(id) as HTMLScriptElement | null;
		if (existing) {
			if (existing.dataset.loaded === 'true') return;
			await new Promise<void>((resolve, reject) => {
				existing.addEventListener('load', () => resolve(), { once: true });
				existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
					once: true
				});
			});
			return;
		}

		await new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.id = id;
			script.src = src;
			script.async = true;
			script.defer = true;
			script.onload = () => {
				script.dataset.loaded = 'true';
				resolve();
			};
			script.onerror = () => reject(new Error(`Failed to load ${src}`));
			document.head.appendChild(script);
		});
	}

	function cleanupWidget() {
		if (typeof window === 'undefined') return;

		const w = window as CaptchaWindow;
		if (widgetId == null) return;

		if (currentProvider === 'cloudflare') {
			w.turnstile?.remove?.(String(widgetId));
		}
		if (currentProvider === 'hcaptcha') {
			w.hcaptcha?.remove?.(Number(widgetId));
		}
		if (currentProvider === 'recaptcha') {
			w.grecaptcha?.reset?.(Number(widgetId));
		}
		widgetId = null;
	}

	function handleSuccess(token: string) {
		onVerified(token);
	}

	async function renderWidget() {
		if (typeof window === 'undefined' || typeof document === 'undefined') return;
		if (!captchaContainer || !currentProvider || !currentApiKey) return;

		error = '';
		isLoading = true;
		cleanupWidget();
		captchaContainer.innerHTML = '';

		try {
			const w = window as CaptchaWindow;
			if (currentProvider === 'cloudflare') {
				await loadScript(
					'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
					'captcha-turnstile-script'
				);
				if (!w.turnstile) throw new Error('Turnstile failed to initialize');
				widgetId = w.turnstile.render(captchaContainer, {
					sitekey: currentApiKey,
					callback: handleSuccess
				});
			} else if (currentProvider === 'hcaptcha') {
				await loadScript(
					'https://js.hcaptcha.com/1/api.js?render=explicit',
					'captcha-hcaptcha-script'
				);
				if (!w.hcaptcha) throw new Error('hCaptcha failed to initialize');
				widgetId = w.hcaptcha.render(captchaContainer, {
					sitekey: currentApiKey,
					callback: handleSuccess
				});
			} else if (currentProvider === 'recaptcha') {
				await loadScript(
					'https://www.google.com/recaptcha/api.js?render=explicit',
					'captcha-recaptcha-script'
				);
				if (!w.grecaptcha) throw new Error('reCAPTCHA failed to initialize');
				widgetId = w.grecaptcha.render(captchaContainer, {
					sitekey: currentApiKey,
					callback: handleSuccess
				});
			} else {
				error = 'Captcha provider not configured correctly.';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to initialize captcha';
		} finally {
			isLoading = false;
		}
	}

	onMount(async () => {
		if (typeof window === 'undefined') return;
		try {
			currentProvider = provider;
			currentApiKey = apiKey;

			if (!currentProvider || !currentApiKey) {
				const config = await getCaptchaConfig();
				currentProvider = config.provider || '';
				currentApiKey = config.apiKey || '';
			}
			await renderWidget();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load captcha configuration';
			isLoading = false;
		}
	});

	onDestroy(() => {
		cleanupWidget();
	});
</script>

<div class="flex w-full flex-col items-center gap-3">
	{#if isLoading}
		<ConfuseSpinner />
	{:else if error}
		<div class="flex flex-col items-center justify-center gap-1 text-sm text-base-content/70">
			<AlertTriangle size={18} />
			<span>{error}</span>
		</div>
	{/if}
	<div bind:this={captchaContainer} class="flex min-h-17.5 w-full justify-center"></div>
</div>
