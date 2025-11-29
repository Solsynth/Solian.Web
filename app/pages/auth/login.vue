<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "~/stores/user"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import type { SnAuthChallenge, SnAuthFactor } from "~/types/api"
import { useMessage } from "naive-ui"

import FingerprintJS from "@fingerprintjs/fingerprintjs"

import IconLight from "~/assets/images/cloudy-lamb.png"

// State management
useHead({
  title: "Sign In"
})

const stage = ref<
  "find-account" | "select-factor" | "enter-code" | "token-exchange"
>("find-account")
const isLoading = ref(false)
const message = useMessage()

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
    message.error("Please enter your email or username.")
    return
  }
  isLoading.value = true

  try {
    challenge.value = await api("/id/auth/challenge", {
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
    message.error(e instanceof Error ? e.message : "An error occurred")
  } finally {
    isLoading.value = false
  }
}

async function getFactors() {
  if (!challenge.value) return

  isLoading.value = true
  try {
    const availableFactors = await api<SnAuthFactor[]>(
      `/id/auth/challenge/${challenge.value.id}/factors`
    )
    factors.value = availableFactors.filter(
      (f: SnAuthFactor) => !challenge.value!.blacklistFactors.includes(f.id)
    )
    if (factors.value.length > 0) {
      selectedFactorId.value = null // Let user choose
    } else if (challenge.value.stepRemain > 0) {
      message.error(
        "No more available authentication factors, but authentication is not complete. Please contact support."
      )
    }
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "An error occurred")
  } finally {
    isLoading.value = false
  }
}

async function requestVerificationCode() {
  if (!selectedFactorId.value || !challenge.value) return

  const isResend = stage.value === "enter-code"
  if (isResend) isLoading.value = true

  try {
    await api(
      `/id/auth/challenge/${challenge.value.id}/factors/${selectedFactorId.value}`,
      { method: "POST" }
    )
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "An error occurred")
    throw e // Rethrow to be handled by caller
  } finally {
    if (isResend) isLoading.value = false
  }
}

async function handleFactorSelected() {
  if (!selectedFactor.value) {
    message.error("Please select an authentication method.")
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
    message.error("Please enter your password/code.")
    return
  }
  isLoading.value = true

  try {
    challenge.value = await api(`/id/auth/challenge/${challenge.value.id}`, {
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
    message.error(e instanceof Error ? e.message : "An error occurred")
  } finally {
    isLoading.value = false
  }
}

const userStore = useUserStore()
const route = useRoute()

async function exchangeToken() {
  isLoading.value = true
  try {
    // The token endpoint gives the Set-Cookie header
    await api<{ token: string }>("/id/auth/token", {
      method: "POST",
      body: {
        grant_type: "authorization_code",
        code: challenge.value!.id
      }
    })

    await userStore.fetchUser()

    const redirectUri = route.query.redirect as string
    if (redirectUri) {
      window.location.href = decodeURIComponent(redirectUri)
    } else {
      await router.push("/")
    }
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "An error occurred")
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

function getFactorIcon(factorType: number) {
  switch (factorType) {
    case 0:
      return "mdi mdi-lock"
    case 1:
      return "mdi mdi-email"
    case 2:
      return "mdi mdi-cellphone"
    case 3:
      return "mdi mdi-clock"
    case 4:
      return "mdi mdi-numeric"
    default:
      return "mdi mdi-shield-key"
  }
}
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease-out;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

<template>
  <div class="flex flex-col gap-3 items-center justify-center h-layout px-4">
    <n-card class="w-full max-w-[1000px]" size="large">
      <div class="p-4 md:p-8">
        <div class="mb-4">
          <img :src="IconLight" alt="CloudyLamb" height="60" width="60" />
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="flex flex-col items-start justify-between">
            <div class="text-left h-auto">
              <div class="text-left h-auto">
                <Transition mode="out-in" name="slide-fade">
                  <div v-if="stage === 'find-account'" key="find-account">
                    <h2 class="text-2xl font-bold mb-1">Sign in</h2>
                    <p class="text-lg">Use your Solarpass</p>
                  </div>
                  <div
                    v-else-if="stage === 'select-factor'"
                    key="select-factor"
                  >
                    <h2 class="text-2xl font-bold mb-1">
                      Choose how to sign in
                    </h2>
                    <p class="text-lg">
                      Select your preferred authentication method
                    </p>
                  </div>
                  <div
                    v-else-if="stage === 'enter-code' && selectedFactor"
                    key="enter-code"
                  >
                    <h2 class="text-2xl font-bold mb-1">
                      Enter your
                      {{
                        selectedFactor.type === 0
                          ? "password"
                          : "verification code"
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
                  <div
                    v-else-if="stage === 'token-exchange'"
                    key="token-exchange"
                  >
                    <h2 class="text-2xl font-bold mb-1">Finalizing Login</h2>
                    <p class="text-lg">
                      Please wait while we complete your sign in.
                    </p>
                  </div>
                </Transition>
              </div>
            </div>
            <div v-if="isLoading" class="mb-4">
              <span class="loading loading-spinner loading-xl"></span>
            </div>
          </div>
          <div class="flex items-center justify-stretch">
            <div class="w-full flex flex-col md:text-right">
              <Transition mode="out-in" name="slide-fade">
                <!-- Stage 1: Find Account -->
                <div v-if="stage === 'find-account'" key="find-account">
                  <n-input
                    size="large"
                    v-model:value="accountIdentifier"
                    placeholder="Email or username"
                    class="text-left"
                    @keydown.enter.prevent="handleFindAccount"
                  />
                  <div class="mr-3 mt-4">
                    <n-button text type="primary" size="small">
                      Forgot Password?
                    </n-button>

                    <div class="flex justify-end">
                      <p class="mt-4 mb-6 text-sm max-w-96">
                        Not your computer? Remember to use Private Browsing
                        windows to sign in.
                      </p>
                    </div>
                  </div>

                  <div class="flex justify-between items-center mt-8">
                    <n-button text tag="a" href="/auth/create-account">
                      Create account
                    </n-button>
                    <n-button
                      type="primary"
                      size="large"
                      @click="handleFindAccount"
                    >
                      Next
                    </n-button>
                  </div>
                </div>

                <!-- Stage 2: Select Factor -->
                <div v-else-if="stage === 'select-factor'" key="select-factor">
                  <n-radio-group
                    v-model:value="selectedFactorId"
                    class="w-full"
                  >
                    <div class="flex flex-col gap-2">
                      <div
                        v-for="factor in factors"
                        :key="factor.id"
                        class="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        @click="selectedFactorId = factor.id"
                      >
                        <n-radio
                          :value="factor.id"
                          :label="getFactorName(factor.type)"
                        />
                        <n-icon size="24">
                          <span :class="getFactorIcon(factor.type)" />
                        </n-icon>
                      </div>
                    </div>
                  </n-radio-group>
                  <div class="flex justify-end mt-6">
                    <n-button
                      type="primary"
                      size="large"
                      :disabled="!selectedFactorId"
                      @click="handleFactorSelected"
                    >
                      Next
                    </n-button>
                  </div>
                </div>

                <!-- Stage 3: Enter Code -->
                <div v-else-if="stage === 'enter-code'" key="enter-code">
                  <n-input
                    v-model:value="password"
                    :type="selectedFactor?.type === 0 ? 'password' : 'text'"
                    :placeholder="
                      selectedFactor?.type === 0 ? 'Password' : 'Code'
                    "
                    show-password-on="click"
                    class="mb-2 text-left"
                    @keydown.enter.prevent="handleVerifyFactor"
                  />
                  <div class="flex justify-between items-center mt-6">
                    <n-button
                      v-if="selectedFactor?.type === 1"
                      text
                      type="primary"
                      @click="requestVerificationCode"
                    >
                      Resend Code
                    </n-button>
                    <div v-else />
                    <n-button
                      type="primary"
                      size="large"
                      @click="handleVerifyFactor"
                    >
                      Verify
                    </n-button>
                  </div>
                </div>

                <!-- Stage 4: Token Exchange -->
                <div
                  v-else-if="stage === 'token-exchange'"
                  key="token-exchange"
                >
                  <div class="flex justify-center">
                    <n-spin size="large" />
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <n-alert
      v-if="route.query.redirect"
      class="w-full max-w-[1000px]"
      type="info"
      title="Login before you continue"
      size="large"
    >
      <div class="flex flex-col gap-1">
        <p>
          You're requesting a page that requires authorization to access, please
          login with your Solarpass and then we will redirect you to:
        </p>
        <n-code class="text-xs">{{ route.query.redirect }}</n-code>
      </div>
    </n-alert>
  </div>
</template>
