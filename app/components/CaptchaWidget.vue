<template>
  <div class="flex justify-center">
    <div v-if="provider === 'cloudflare'">
      <turnstile v-if="!!apiKey" :sitekey="apiKey" @callback="handleSuccess" />
      <div v-else class="mx-auto">
        <n-spin />
      </div>
    </div>
    <div v-else-if="provider === 'hcaptcha'">
      <hcaptcha
        v-if="!!apiKey"
        :sitekey="apiKey"
        @verify="(tk: string) => handleSuccess(tk)"
      />
      <div v-else class="mx-auto">
        <n-spin />
      </div>
    </div>
    <div
      v-else-if="provider === 'recaptcha'"
      class="h-captcha"
      :data-sitekey="apiKey"
    />
    <div v-else class="flex flex-col items-center justify-center gap-1">
      <span class="mdi mdi-alert-circle-outline text-3xl"></span>
      <span>Captcha provider not configured correctly.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import Turnstile from "cfturnstile-vue3"
import Hcaptcha from "@hcaptcha/vue3-hcaptcha"

const props = defineProps({
  provider: {
    type: String,
    required: false,
    default: ""
  },
  apiKey: {
    type: String,
    required: false,
    default: ""
  }
})

const provider = ref(props.provider)
const apiKey = ref(props.apiKey)

const api = useSolarNetwork()
const emit = defineEmits(["verified"])

function handleSuccess(token: string) {
  emit("verified", token)
}

// This function will be used to fetch configuration if needed,
// Like the backend didn't embed the configuration properly.
async function fetchConfiguration() {
  const resp = await api<{ provider: string; apiKey: string }>("/id/captcha")
  provider.value = resp.provider
  apiKey.value = resp.apiKey
}

onMounted(() => {
  if (!provider.value || !apiKey.value) fetchConfiguration()
})
</script>
