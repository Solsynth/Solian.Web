<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import { CheckIcon } from "lucide-vue-next"

import IconLight from "~/assets/images/cloudy-lamb.png"
import type { SnCloudFile } from "~/types/api/post"

const route = useRoute()
const api = useSolarNetwork()

const message = useMessage()

useHead({
  title: "Authorize Application"
})

// State
const isLoading = ref(true)
const isAuthorizing = ref(false)
const clientInfo = ref<{
  clientName?: string
  homeUri?: string
  picture?: SnCloudFile
  background?: SnCloudFile
  scopes?: string[]
} | null>(null)
const isNewApp = ref(false)

// Computed properties
const requestedScopes = computed(() => {
  return clientInfo.value?.scopes || []
})

// Methods
async function fetchClientInfo() {
  try {
    const queryString = window.location.search.slice(1)
    clientInfo.value = await api(`/id/auth/open/authorize?${queryString}`)
    checkIfNewApp()
  } catch (err) {
    message.error(err instanceof Error ? err.message : String(err))
  } finally {
    isLoading.value = false
  }
}

function checkIfNewApp() {
  // In a real app, you might want to check if this is the first time authorizing this app
  // For now, we'll just set it to false
  isNewApp.value = false
}

async function handleAuthorize(authorize = true) {
  isAuthorizing.value = true
  try {
    const data = await api<{ redirectUri?: string }>(
      "/id/auth/open/authorize",
      {
        method: "POST",
        body: new URLSearchParams({
          ...route.query,
          authorize: authorize ? "true" : "false"
        })
      }
    )

    if (data.redirectUri) {
      window.location.href = data.redirectUri
    }
  } catch (err) {
    message.error(err instanceof Error ? err.message : String(err))
  } finally {
    isAuthorizing.value = false
  }
}

function handleDeny() {
  handleAuthorize(false)
}

// Lifecycle
onMounted(() => {
  fetchClientInfo()
})

definePageMeta({
  middleware: "auth"
})

const apiBase = useSolarNetworkUrl()
const clientAvatar = computed(() =>
  clientInfo.value?.picture
    ? `${apiBase}/drive/files/${clientInfo.value.picture.id}`
    : undefined
)
const clientBackground = computed(() =>
  clientInfo.value?.background
    ? `${apiBase}/drive/files/${clientInfo.value.background.id}?original=true`
    : undefined
)

const pageStyle = computed(() => {
  if (!clientBackground.value) return {}
  return {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${clientBackground.value}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  }
})
</script>

<template>
  <div class="fixed inset-0 transition-all duration-500" :style="pageStyle" />
  <div class="relative flex items-center justify-center min-h-layout px-4">
    <n-card
      :class="[
        'w-full',
        'max-w-[1000px]',
        { 'backdrop-blur-2xl': clientBackground },
        { 'shadow-xl': clientBackground }
      ]"
      size="large"
      :style="
        clientBackground ? 'background-color: rgba(255, 255, 255, 0.1)' : ''
      "
      :content-style="clientBackground ? 'background-color: transparent' : ''"
    >
      <div v-if="isLoading" class="flex justify-center p-8">
        <n-spin size="large" />
      </div>
      <div v-else class="p-4 md:p-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Left Column: Title -->
          <div class="flex flex-col items-start justify-start">
            <div class="mb-4">
              <img :src="IconLight" alt="CloudyLamb" height="60" width="60" />
            </div>
            <div class="text-left h-auto">
              <h2 class="text-2xl font-bold mb-1">Authorize Application</h2>
              <p class="text-lg">Grant access to your Solar Network account</p>
            </div>
          </div>

          <!-- Right Column: Content -->
          <div class="flex flex-col items-end justify-stretch">
            <div class="w-full flex flex-col md:text-right">
              <div class="mb-3 h-[60px] px-[4px] pt-[8px]">
                <n-avatar :src="clientAvatar" :size="52" />
              </div>
              <!-- App Info Section -->
              <div v-if="clientInfo" class="mb-6">
                <div class="flex flex-col items-end mb-4">
                  <h3 class="text-xl font-semibold">
                    {{ clientInfo.clientName || "Unknown Application" }}
                  </h3>
                  <p class="text-base">
                    {{
                      isNewApp
                        ? "Wants to access your Solar Network account"
                        : "Wants to access your account"
                    }}
                  </p>
                </div>

                <!-- Requested Permissions -->
                <n-card embedded class="mb-4 text-left">
                  <h4 class="font-medium mb-2">
                    This will allow
                    {{ clientInfo.clientName || "the app" }} to
                  </h4>
                  <n-list style="background-color: transparent" size="small">
                    <n-list-item
                      v-for="scope in requestedScopes"
                      :key="scope"
                      class="bg-transparent"
                      style="padding: 0"
                    >
                      <template #prefix>
                        <n-icon
                          class="mt-1 mr-2"
                          color="#18a058"
                          :size="16"
                          :component="CheckIcon"
                        />
                      </template>
                      <span>{{ scope }}</span>
                    </n-list-item>
                  </n-list>
                </n-card>

                <!-- Buttons -->
                <div class="flex gap-3 mt-4">
                  <n-button
                    type="primary"
                    :loading="isAuthorizing"
                    class="grow"
                    size="large"
                    @click="handleAuthorize(true)"
                  >
                    Authorize
                  </n-button>
                  <n-button
                    secondary
                    :disabled="isAuthorizing"
                    class="grow"
                    size="large"
                    @click="handleDeny"
                  >
                    Deny
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>
