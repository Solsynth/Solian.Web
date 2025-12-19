<template>
  <div class="flex items-center justify-center min-h-screen">
    <n-card title="Order Payment" class="max-w-sm">
      <template #header-icon>
        <n-icon :component="Wallet" />
      </template>
      <n-alert v-if="done" type="success" class="mb-4">
        The order has been paid successfully. You can now close this tab and
        return to Solar Network!
      </n-alert>
      <n-alert
        v-else-if="!!error"
        type="error"
        title="Something went wrong"
        class="mb-4"
      >
        {{ error }}
      </n-alert>
      <div v-else-if="!!order" class="flex flex-col gap-2">
        <p>Order for {{ order.productIdentifier ?? "unknown" }}</p>
        <div class="flex items-center gap-2">
          <n-icon :component="Tag" />
          <strong>{{ order.remarks }}</strong>
        </div>
        <div class="flex items-center gap-2">
          <n-icon :component="CircleDollarSign" />
          <span>Amount</span>
          <strong>{{ order.amount }} {{ order.currency }}</strong>
        </div>
        <div v-if="order.expiredAt" class="flex items-center gap-2">
          <n-icon :component="Calendar" />
          <span>Until</span>
          <strong>{{ new Date(order.expiredAt).toLocaleString() }}</strong>
        </div>
        <div class="mt-4">
          <n-input
            v-model:value="pinCode"
            type="password"
            show-password-on="click"
            placeholder="6-digit PIN"
            maxlength="6"
            :input-props="{ autocomplete: 'one-time-code' }"
          />
          <n-button
            type="primary"
            :loading="submitting"
            class="mt-4 w-full"
            @click="pay"
          >
            <template #icon>
              <n-icon :component="Check" />
            </template>
            Pay
          </n-button>
        </div>
      </div>
      <div v-else class="flex justify-center p-8">
        <n-spin size="medium" />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import type { SnWalletOrder } from "~/types/api/order"
import {
  Wallet,
  Tag,
  CircleDollarSign,
  Calendar,
  Check
} from "lucide-vue-next"

const route = useRoute()

const orderId: string =
  typeof route.params.id === "string"
    ? route.params.id
    : route.params.id?.join("/") || ""
const order = ref<SnWalletOrder | null>(null)
const error = ref<string | null>(null)

const pinCode = ref<string>()

const submitting = ref(false)
const done = ref(false)

const api = useSolarNetwork()

async function fetchOrder() {
  try {
    const resp = await api<SnWalletOrder>(
      `/pass/orders/${encodeURIComponent(orderId)}`
    )
    order.value = resp
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

async function pay() {
  if (submitting.value) return
  submitting.value = true
  try {
    await api(`/pass/orders/${encodeURIComponent(orderId)}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin_code: pinCode.value })
    })
    done.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => fetchOrder())

definePageMeta({
  middleware: ["auth"],
  title: "Solarpay"
})
</script>
