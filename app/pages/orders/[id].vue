<template>
  <div class="d-flex align-center justify-center fill-height">
    <v-card
      max-width="400"
      title="Order Payment"
      prepend-icon="mdi-cash"
      class="pa-2"
    >
      <v-card-text>
        <v-alert type="success" v-if="done" class="mb-4">
          The order has been paid successfully. Now you can close this tab and
          back to the Solar Network!
        </v-alert>
        <v-alert
          type="error"
          v-else-if="!!error"
          title="Something went wrong"
          class="mb-4"
          >{{ error }}</v-alert
        >
        <div v-else-if="!!order">
          <p class="mb-2">
            Order for {{ order.productIdentifier ?? "unknown" }}
          </p>
          <div class="d-flex align-center gap-2 mb-2">
            <v-icon size="18">mdi-tag</v-icon>
            <strong>{{ order.remarks }}</strong>
          </div>
          <div class="d-flex align-center gap-2 mb-2">
            <v-icon size="18">mdi-cash</v-icon>
            <span>Amount</span>
            <strong>{{ order.amount }} {{ order.currency }}</strong>
          </div>
          <div class="d-flex align-center gap-2 mb-4" v-if="order.expiredAt">
            <v-icon size="18">mdi-calendar</v-icon>
            <span>Until</span>
            <strong>{{ new Date(order.expiredAt).toLocaleString() }}</strong>
          </div>
          <div class="mt-4">
            <v-otp-input
              v-model="pinCode"
              label="Pin Code"
              length="6"
              type="password"
              density="comfortable"
            ></v-otp-input>
            <v-btn
              color="primary"
              :loading="submitting"
              @click="pay"
              class="mt-4"
            >
              <v-icon left>mdi-check</v-icon>
              Pay
            </v-btn>
          </div>
        </div>
        <v-progress-circular
          v-else
          indeterminate
          size="32"
          class="mt-4"
        ></v-progress-circular>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import type { SnWalletOrder } from "~/types/api/order"

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
      `/id/orders/${encodeURIComponent(orderId)}`
    )
    order.value = resp
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

async function pay() {
  submitting.value = true
  try {
    await api(`/id/orders/${encodeURIComponent(orderId)}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin_code: pinCode.value })
    })
    done.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

onMounted(() => fetchOrder())

definePageMeta({
  middleware: ["auth"],
  title: "Solarpay"
})
</script>

