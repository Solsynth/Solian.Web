<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Wallet, Tag, CircleDollarSign, Calendar, Check } from 'lucide-svelte';
	import { getOrder, payOrder, type WalletOrder } from '$lib/utils/api';

	let order = $state<WalletOrder | null>(null);
	let error = $state<string | null>(null);
	let pinCode = $state('');
	let submitting = $state(false);
	let done = $state(false);
	let loading = $state(true);

	const orderId = $derived($page.params.id ?? '');

	async function fetchOrder() {
		if (!orderId) {
			error = 'Invalid order id';
			loading = false;
			return;
		}
		loading = true;
		error = null;
		try {
			order = await getOrder(orderId);
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			loading = false;
		}
	}

	async function pay() {
		if (submitting || pinCode.length !== 6 || !orderId) return;
		submitting = true;
		error = null;
		try {
			await payOrder(orderId, pinCode);
			done = true;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			submitting = false;
		}
	}

	onMount(fetchOrder);
</script>

<svelte:head>
	<title>Order Payment - Solar Network</title>
</svelte:head>

<div class="w-full max-w-md">
	<div class="card/90 shadow-xl backdrop-blur">
		<div class="card-body">
			<div class="mb-2 flex items-center gap-2">
				<Wallet class="text-primary" size={18} />
				<h1 class="text-lg font-bold">Order Payment</h1>
			</div>

			{#if done}
				<div class="alert alert-success">
					<span>The order has been paid successfully. You can close this tab now.</span>
				</div>
			{:else if error}
				<div class="alert alert-error">
					<span>{error}</span>
				</div>
			{:else if loading}
				<div class="flex justify-center py-8">
					<span class="loading loading-md loading-spinner"></span>
				</div>
			{:else if order}
				<div class="space-y-3 text-sm">
					<p>Order for {order.productIdentifier ?? 'unknown'}</p>
					<div class="flex items-center gap-2">
						<Tag size={16} />
						<strong>{order.remarks || 'No remarks'}</strong>
					</div>
					<div class="flex items-center gap-2">
						<CircleDollarSign size={16} />
						<span>Amount</span>
						<strong>{order.amount} {order.currency}</strong>
					</div>
					{#if order.expiredAt}
						<div class="flex items-center gap-2">
							<Calendar size={16} />
							<span>Until</span>
							<strong>{new Date(order.expiredAt).toLocaleString()}</strong>
						</div>
					{/if}
				</div>

				<div class="mt-4">
					<input
						class="input-bordered input w-full"
						type="password"
						placeholder="6-digit PIN"
						maxlength="6"
						inputmode="numeric"
						autocomplete="one-time-code"
						bind:value={pinCode}
					/>
					<button
						class="btn mt-4 w-full btn-primary"
						onclick={pay}
						disabled={submitting || pinCode.length !== 6}
					>
						{#if submitting}
							<span class="loading loading-sm loading-spinner"></span>
						{:else}
							<Check size={16} />
						{/if}
						Pay
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
