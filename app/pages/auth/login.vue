<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "~/stores/user"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import type { SnAuthChallenge, SnAuthFactor } from "~/types/api"

import FingerprintJS from "@fingerprintjs/fingerprintjs"

import IconLight from "~/assets/images/cloudy-lamb.png"
import IconDark from "~/assets/images/cloudy-lamb@dark.png"

// State management
useHead({
  title: "Sign In"
})

const stage = ref<
  "find-account" | "select-factor" | "enter-code" | "token-exchange"
>("find-account")
const isLoading = ref(false)
const error = ref<string | null>(null)

// Computed for v-window active index
const activeStageIndex = computed(() => {
  switch (stage.value) {
    case "find-account":
      return 0
    case "select-factor":
      return 1
    case "enter-code":
      return 2
    case "token-exchange":
      return 3
    default:
      return 0
  }
})

// Stage 1: Find Account
const accountIdentifier = ref("")
const deviceId = ref("")

// Stage 2 & 3: Challenge
const challenge = ref<SnAuthChallenge | null>(null)
const factors = ref<SnAuthFactor[]>([])
const selectedFactorId = ref<string | null>(null)
const password = ref("") // Used for password or verification code

const router = useRouter()
const api = useSolarNetwork()

// Generate deviceId based on browser fingerprint
onMounted(async () => {
  const fp = await FingerprintJS.load()
  const result = await fp.get()
  deviceId.value = result.visitorId
})

const selectedFactor = computed(() => {
  if (!selectedFactorId.value) return null
  return factors.value.find((f) => f.id === selectedFactorId.value)
})

async function handleFindAccount() {
  if (!accountIdentifier.value) {
    error.value = "Please enter your email or username."
    return
  }
  isLoading.value = true
  error.value = null

  try {
    challenge.value = await api("/pass/auth/challenge", {
      method: "POST",
      body: {
        platform: 1,
        account: accountIdentifier.value,
        device_id: deviceId.value
      }
    })

    await getFactors()
    stage.value = "select-factor"
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "An error occurred"
  } finally {
    isLoading.value = false
  }
}

async function getFactors() {
  if (!challenge.value) return

  isLoading.value = true
  error.value = null
  try {
    const availableFactors = await api<SnAuthFactor[]>(
      `/pass/auth/challenge/${challenge.value.id}/factors`
    )
    factors.value = availableFactors.filter(
      (f: SnAuthFactor) => !challenge.value!.blacklistFactors.includes(f.id)
    )
    if (factors.value.length > 0) {
      selectedFactorId.value = null // Let user choose
    } else if (challenge.value.stepRemain > 0) {
      error.value =
        "No more available authentication factors, but authentication is not complete. Please contact support."
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "An error occurred"
  } finally {
    isLoading.value = false
  }
}

async function requestVerificationCode() {
  if (!selectedFactorId.value || !challenge.value) return

  const isResend = stage.value === "enter-code"
  if (isResend) isLoading.value = true
  error.value = null

  try {
    await api(
      `/pass/auth/challenge/${challenge.value.id}/factors/${selectedFactorId.value}`,
      { method: "POST" }
    )
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "An error occurred"
    throw e // Rethrow to be handled by caller
  } finally {
    if (isResend) isLoading.value = false
  }
}

async function handleFactorSelected() {
  if (!selectedFactor.value) {
    error.value = "Please select an authentication method."
    return
  }

  // For password (0), just move to the next step
  if (selectedFactor.value.type === 0) {
    stage.value = "enter-code"
    return
  }

  // For code-based factors (1, 2, 3, 4), send the code first
  if ([1, 2, 3, 4].includes(selectedFactor.value.type)) {
    isLoading.value = true
    error.value = null
    try {
      await requestVerificationCode()
      stage.value = "enter-code"
    } catch {
      // Error is already set by requestVerificationCode
    } finally {
      isLoading.value = false
    }
  }
}

async function handleVerifyFactor() {
  if (!selectedFactorId.value || !password.value || !challenge.value) {
    error.value = "Please enter your password/code."
    return
  }
  isLoading.value = true
  error.value = null

  try {
    challenge.value = await api(`/pass/auth/challenge/${challenge.value.id}`, {
      method: "PATCH",
      body: {
        factor_id: selectedFactorId.value,
        password: password.value
      }
    })

    password.value = ""

    if (challenge.value!.stepRemain === 0) {
      stage.value = "token-exchange"
      await exchangeToken()
    } else {
      await getFactors()
      stage.value = "select-factor" // MFA step
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "An error occurred"
  } finally {
    isLoading.value = false
  }
}

const userStore = useUserStore()
const route = useRoute()

async function exchangeToken() {
  isLoading.value = true
  error.value = null
  try {
    // The token endpoint gives the Set-Cookie header
    await api<{ token: string }>("/pass/auth/token", {
      method: "POST",
      body: {
        grant_type: "authorization_code",
        code: challenge.value!.id
      }
    })

    await userStore.fetchUser()

    const redirectUri = route.query.redirect_uri as string
    if (redirectUri) {
      window.location.href = redirectUri
    } else {
      await router.push("/")
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "An error occurred"
    stage.value = "select-factor" // Go back if token exchange fails
  } finally {
    isLoading.value = false
  }
}

function getFactorName(factorType: number) {
  switch (factorType) {
    case 0: // Password
      return "Password"
    case 1: // EmailCode
      return "Email Code"
    case 2: // InAppCode
      return "In-App Code"
    case 3: // TimedCode
      return "Timed Code"
    case 4: // PinCode
      return "PIN Code"
    default:
      return "Unknown Factor"
  }
}

const colorMode = useColorMode()
</script>

<template>
  <v-container class="d-flex align-center justify-center fill-height">
    <v-card max-width="1000" rounded="lg" width="100%">
      <div v-if="isLoading" class="d-flex justify-center mb-4">
        <v-progress-linear indeterminate color="primary" height="4" />
      </div>
      <div class="pa-8">
        <div class="mb-4">
          <img
            :src="colorMode.value == 'dark' ? IconDark : IconLight"
            alt="CloudyLamb"
            height="60"
            width="60"
          />
        </div>
        <v-row>
          <v-col cols="12" lg="6" class="d-flex align-start justify-start">
            <div class="md:text-left h-auto">
              <div v-if="stage === 'find-account'">
                <h2 class="text-2xl font-bold mb-1">Sign in</h2>
                <p class="text-lg">Use your Solarpass</p>
              </div>
              <div v-if="stage === 'select-factor'">
                <h2 class="text-2xl font-bold mb-1">Choose how to sign in</h2>
                <p class="text-lg">
                  Select your preferred authentication method
                </p>
              </div>
              <div v-if="stage === 'enter-code' && selectedFactor">
                <h2 class="text-2xl font-bold mb-1">
                  Enter your
                  {{
                    selectedFactor.type === 0 ? "password" : "verification code"
                  }}
                </h2>
                <p v-if="selectedFactor.type === 1" class="text-lg">
                  A code has been sent to
                  {{ selectedFactor.contact || "your email" }}.
                </p>
                <p v-if="selectedFactor.type === 2" class="text-lg">
                  Enter the code from your in-app authenticator.
                </p>
                <p v-if="selectedFactor.type === 3" class="text-lg">
                  Enter the timed verification code.
                </p>
                <p v-if="selectedFactor.type === 4" class="text-lg">
                  Enter your PIN code.
                </p>
                <p v-if="selectedFactor.type === 0" class="text-lg">
                  Enter your password to continue.
                </p>
              </div>
              <div v-if="stage === 'token-exchange'">
                <h2 class="text-2xl font-bold mb-1">Finalizing Login</h2>
                <p class="text-lg">
                  Please wait while we complete your sign in.
                </p>
              </div>
            </div>
          </v-col>
          <v-col cols="12" lg="6" class="d-flex align-center justify-stretch">
            <div class="w-full d-flex flex-column md:text-right">
              <v-window
                v-model="activeStageIndex"
                class="align-self-stretch pt-2"
              >
                <!-- Stage 1: Find Account -->
                <v-window-item :value="0">
                  <v-text-field
                    v-model="accountIdentifier"
                    label="Email or username"
                    variant="outlined"
                    class="mb-2"
                    @keydown.enter="handleFindAccount"
                  />
                  <v-btn
                    slim
                    variant="text"
                    class="text-capitalize"
                    color="primary"
                    >Forgot password?</v-btn
                  >

                  <div class="d-flex justify-end">
                    <p class="mt-4 mb-6 text-sm max-w-96">
                      Not your computer? Remember to use Private Browsing
                      windows to sign in.
                    </p>
                  </div>

                  <div class="d-flex justify-space-between align-center mt-8">
                    <v-btn
                      variant="text"
                      class="text-capitalize"
                      to="/auth/create-account"
                    >
                      Create account
                    </v-btn>
                    <v-btn
                      color="primary"
                      size="large"
                      @click="handleFindAccount"
                    >
                      Next
                    </v-btn>
                  </div>
                </v-window-item>

                <!-- Stage 2: Select Factor -->
                <v-window-item :value="1">
                  <v-radio-group v-model="selectedFactorId">
                    <v-list>
                      <v-list-item v-for="factor in factors" :key="factor.id">
                        <v-list-item-action>
                          <v-radio
                            :value="factor.id"
                            :label="getFactorName(factor.type)"
                          />
                        </v-list-item-action>
                        <template #append>
                          <v-icon>{{
                            factor.type === 0
                              ? "mdi-lock"
                              : factor.type === 1
                                ? "mdi-email"
                                : factor.type === 2
                                  ? "mdi-cellphone"
                                  : factor.type === 3
                                    ? "mdi-clock"
                                    : factor.type === 4
                                      ? "mdi-numeric"
                                      : "mdi-shield-key"
                          }}</v-icon>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-radio-group>
                  <div class="d-flex justify-end mt-6">
                    <v-btn
                      color="primary"
                      size="large"
                      :disabled="!selectedFactorId"
                      @click="handleFactorSelected"
                    >
                      Next
                    </v-btn>
                  </div>
                </v-window-item>

                <!-- Stage 3: Enter Code -->
                <v-window-item :value="2">
                  <v-text-field
                    v-model="password"
                    :type="selectedFactor?.type === 0 ? 'password' : 'text'"
                    :label="selectedFactor?.type === 0 ? 'Password' : 'Code'"
                    variant="outlined"
                    class="mb-2"
                    @keydown.enter="handleVerifyFactor"
                  />
                  <div class="d-flex justify-space-between align-center mt-6">
                    <v-btn
                      v-if="selectedFactor?.type === 1"
                      variant="text"
                      class="text-capitalize pl-0"
                      color="primary"
                      @click="requestVerificationCode"
                    >
                      Resend Code
                    </v-btn>
                    <v-spacer v-else />
                    <v-btn
                      color="primary"
                      size="large"
                      @click="handleVerifyFactor"
                    >
                      Verify
                    </v-btn>
                  </div>
                </v-window-item>

                <!-- Stage 4: Token Exchange -->
                <v-window-item :value="3">
                  <div class="d-flex justify-center">
                    <v-progress-circular
                      indeterminate
                      size="64"
                      color="primary"
                    />
                  </div>
                </v-window-item>
              </v-window>

              <v-alert
                v-if="error"
                type="error"
                closable
                class="mt-2"
                @update:model-value="error = null"
              >
                {{ error }}
              </v-alert>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-card>
    <footer-compact />
  </v-container>
</template>
