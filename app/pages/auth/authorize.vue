<template>
  <v-container class="d-flex align-center justify-center fill-height">
    <v-card max-width="1000" rounded="lg" width="100%">
      <div v-if="isLoading" class="d-flex justify-center mb-4">
        <v-progress-linear indeterminate color="primary" height="4" />
      </div>
      <div class="pa-8">
        <div class="mb-4">
          <img :src="IconLight" alt="CloudyLamb" height="60" width="60" />
        </div>
        <v-row>
          <v-col cols="12" lg="6" class="d-flex align-start justify-start">
            <div class="md:text-left h-auto">
              <h2 class="text-2xl font-bold mb-1">Authorize Application</h2>
              <p class="text-lg">Grant access to your Solar Network account</p>
            </div>
          </v-col>
          <v-col cols="12" lg="6" class="d-flex align-center justify-stretch">
            <div class="w-full d-flex flex-column md:text-right">
              <div v-if="error" class="mb-4">
                <v-alert
                  type="error"
                  closable
                  @update:model-value="error = null"
                >
                  {{ error }}
                </v-alert>
              </div>

              <!-- App Info Section -->
              <div v-if="clientInfo" class="mb-6">
                <div class="d-flex align-center mb-4 text-left">
                  <div>
                    <h3 class="text-xl font-semibold">
                      {{ clientInfo.clientName || "Unknown Application" }}
                    </h3>
                    <p class="text-base">
                      {{
                        isNewApp
                          ? "wants to access your Solar Network account"
                          : "wants to access your account"
                      }}
                    </p>
                  </div>
                </div>

                <!-- Requested Permissions -->
                <v-card variant="outlined" class="pa-4 mb-4 text-left">
                  <h4 class="font-medium mb-2">
                    This will allow
                    {{ clientInfo.clientName || "the app" }} to
                  </h4>
                  <ul class="space-y-1">
                    <li
                      v-for="scope in requestedScopes"
                      :key="scope"
                      class="d-flex align-start"
                    >
                      <v-icon class="mt-1 mr-2" color="success" size="18"
                        >mdi-check</v-icon
                      >
                      <span>{{ scope }}</span>
                    </li>
                  </ul>
                </v-card>

                <!-- Buttons -->
                <div class="d-flex gap-3 mt-4">
                  <v-btn
                    color="primary"
                    :loading="isAuthorizing"
                    class="grow"
                    size="large"
                    @click="handleAuthorize"
                  >
                    Authorize
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    :disabled="isAuthorizing"
                    class="grow"
                    size="large"
                    @click="handleDeny"
                  >
                    Deny
                  </v-btn>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-card>
    <footer-compact />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import { useSolarNetwork } from "~/composables/useSolarNetwork"

import IconLight from "~/assets/images/cloudy-lamb.png"

const route = useRoute()
const api = useSolarNetwork()

useHead({
  title: "Authorize Application"
})

// State
const isLoading = ref(true)
const isAuthorizing = ref(false)
const error = ref<string | null>(null)
const clientInfo = ref<{
  clientName?: string
  homeUri?: string
  picture?: { url: string }
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
    error.value =
      (err instanceof Error ? err.message : String(err)) ||
      "An error occurred while loading the authorization request"
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
    error.value =
      (err instanceof Error ? err.message : String(err)) ||
      "An error occurred during authorization"
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
</script>

<style scoped>
/* Add any custom styles here */
</style>
