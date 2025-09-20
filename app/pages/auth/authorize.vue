<template>
  <v-container class="d-flex align-center justify-center fill-height">
    <v-card max-width="1000" rounded="lg" width="100%">
      <div v-if="isLoading" class="d-flex justify-center mb-4">
        <v-progress-linear indeterminate color="primary" height="4" />
      </div>
      <div class="pa-8">
        <div class="mb-4">
          <img
            :src="$vuetify.theme.current.dark ? IconDark : IconLight"
            alt="CloudyLamb"
            height="60"
            width="60"
          />
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
                <div class="d-flex align-center mb-4">
                  <v-avatar
                    v-if="clientInfo.picture"
                    :src="clientInfo.picture.url"
                    :alt="clientInfo.client_name"
                    size="large"
                    class="mr-3"
                  />
                  <div>
                    <h3 class="text-xl font-semibold">
                      {{ clientInfo.client_name || 'Unknown Application' }}
                    </h3>
                    <p class="text-base">
                      {{ isNewApp ? 'wants to access your Solar Network account' : 'wants to access your account' }}
                    </p>
                  </div>
                </div>

                <!-- Requested Permissions -->
                <v-card variant="outlined" class="pa-4 mb-4">
                  <h4 class="font-medium mb-2">
                    This will allow {{ clientInfo.client_name || 'the app' }} to:
                  </h4>
                  <ul class="space-y-1">
                    <li v-for="scope in requestedScopes" :key="scope" class="d-flex align-start">
                      <v-icon class="mt-1 mr-2" color="success">mdi-check-box</v-icon>
                      <span>{{ scope }}</span>
                    </li>
                  </ul>
                </v-card>

                <!-- Buttons -->
                <div class="d-flex gap-3 mt-4">
                  <v-btn
                    color="primary"
                    :loading="isAuthorizing"
                    @click="handleAuthorize"
                    class="flex-grow-1"
                    size="large"
                  >
                    Authorize
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    :disabled="isAuthorizing"
                    @click="handleDeny"
                    class="flex-grow-1"
                    size="large"
                  >
                    Deny
                  </v-btn>
                </div>

                <div class="mt-4 text-sm text-center">
                  By authorizing, you agree to the
                  <v-btn
                    variant="text"
                    size="small"
                    @click="openTerms"
                    class="px-1 text-capitalize"
                  >
                    Terms of Service
                  </v-btn>
                  and
                  <v-btn
                    variant="text"
                    size="small"
                    @click="openPrivacy"
                    class="px-1 text-capitalize"
                  >
                    Privacy Policy
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSolarNetwork } from '~/composables/useSolarNetwork'

import IconLight from '~/assets/images/cloudy-lamb.png'
import IconDark from '~/assets/images/cloudy-lamb@dark.png'

const route = useRoute()
const api = useSolarNetwork()

// State
const isLoading = ref(true)
const isAuthorizing = ref(false)
const error = ref<string | null>(null)
const clientInfo = ref<{
  client_name?: string
  home_uri?: string
  picture?: { url: string }
  terms_of_service_uri?: string
  privacy_policy_uri?: string
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
  } catch (err: any) {
    error.value = err.message || 'An error occurred while loading the authorization request'
  } finally {
    isLoading.value = false
  }
}

function checkIfNewApp() {
  // In a real app, you might want to check if this is the first time authorizing this app
  // For now, we'll just set it to false
  isNewApp.value = false
}

async function handleAuthorize() {
  isAuthorizing.value = true
  try {
    const data = await api<{ redirect_uri?: string }>('/auth/open/authorize', {
      method: 'POST',
      body: {
        ...route.query,
        authorize: 'true',
      },
    })

    if (data.redirect_uri) {
      window.location.href = data.redirect_uri
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred during authorization'
  } finally {
    isAuthorizing.value = false
  }
}

function handleDeny() {
  // Redirect back to the client with an error
  // Ensure redirect_uri is always a string (not an array)
  const redirectUriStr = Array.isArray(route.query.redirect_uri)
    ? route.query.redirect_uri[0] || clientInfo.value?.home_uri || '/'
    : route.query.redirect_uri || clientInfo.value?.home_uri || '/'
  const redirectUri = new URL(redirectUriStr)
  // Ensure state is always a string (not an array)
  const state = Array.isArray(route.query.state)
    ? route.query.state[0] || ''
    : route.query.state || ''
  const params = new URLSearchParams({
    error: 'access_denied',
    error_description: 'The user denied the authorization request',
    state: state,
  })
  window.open(`${redirectUri}?${params}`, "_self")
}

function openTerms() {
  window.open(clientInfo.value?.terms_of_service_uri || '#', "_blank")
}

function openPrivacy() {
  window.open(clientInfo.value?.privacy_policy_uri || '#', "_blank")
}

// Lifecycle
onMounted(() => {
  fetchClientInfo()
})
</script>

<style scoped>
/* Add any custom styles here */
</style>
