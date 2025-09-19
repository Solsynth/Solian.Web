<template>
  <v-container class="d-flex align-center justify-center fill-height">
    <v-card class="pa-4" max-width="500">
      <v-card-title>Create a new Solar Network ID</v-card-title>
      <v-overlay :model-value="isLoading" class="align-center justify-center">
        <v-progress-circular indeterminate size="64" />
      </v-overlay>
      <v-form @submit.prevent="handleCreateAccount">
        <v-text-field
          v-model="formModel.name"
          label="Username"
          variant="outlined"
          :rules="nameRules"
          class="mb-4"
        />
        <v-text-field
          v-model="formModel.nick"
          label="Nickname"
          variant="outlined"
          :rules="nickRules"
          class="mb-4"
        />
        <v-text-field
          v-model="formModel.email"
          label="Email"
          placeholder="your@email.com"
          variant="outlined"
          :rules="emailRules"
          class="mb-4"
        />
        <v-text-field
          v-model="formModel.password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          variant="outlined"
          :rules="passwordRules"
          class="mb-4"
        />

        <div class="d-flex justify-center mb-4">
          <client-only>
            <captcha-widget
              :provider="captchaProvider"
              :api-key="captchaApiKey"
              @verified="onCaptchaVerified"
            />
          </client-only>
        </div>

        <v-btn
          type="submit"
          color="primary"
          block
          size="large"
          :disabled="isLoading"
        >
          Create Account
        </v-btn>

        <div class="mt-3 text-center text-body-2 opacity-75">
          <v-btn
            variant="text"
            block
            size="small"
            to="/auth/login"
          >
            Already have an account? Login
          </v-btn>
        </div>
      </v-form>
      <v-alert
        v-if="error"
        type="error"
        closable
        class="mt-4"
        @update:model-value="error = null"
      >
        {{ error }}
      </v-alert>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue"
import { useRouter } from "vue-router"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import CaptchaWidget from "~/components/CaptchaWidget.vue"

const router = useRouter()
const api = useSolarNetwork()

const isLoading = ref(false)
const error = ref<string | null>(null)

const formModel = reactive({
  name: "",
  nick: "",
  email: "",
  password: "",
  language: "en-us",
  captchaToken: ""
})

// Get captcha provider and API key from global data
const captchaProvider = ref((window as { DyPrefetch?: { provider?: string } }).DyPrefetch?.provider || "")
const captchaApiKey = ref((window as { DyPrefetch?: { api_key?: string } }).DyPrefetch?.api_key || "")

const nameRules = [
  (v: string) => !!v || "Please enter a username",
  (v: string) =>
    /^[A-Za-z0-9_-]+$/.test(v) ||
    "Username can only contain letters, numbers, underscores, and hyphens."
]

const nickRules = [(v: string) => !!v || "Please enter a nickname"]

const emailRules = [
  (v: string) => !!v || "Please enter your email",
  (v: string) => /.+@.+\..+/.test(v) || "Please enter a valid email address"
]

const passwordRules = [
  (v: string) => !!v || "Please enter a password",
  (v: string) => v.length >= 4 || "Password must be at least 4 characters long"
]



const onCaptchaVerified = (token: string) => {
  formModel.captchaToken = token
}

async function handleCreateAccount() {
  isLoading.value = true
  error.value = null

  try {
    await api("/id/accounts", {
      method: "POST",
      body: {
        name: formModel.name,
        nick: formModel.nick,
        email: formModel.email,
        password: formModel.password,
        language: formModel.language,
        captcha_token: formModel.captchaToken
      }
    })

    // On success, redirect to login page
    alert(
      "Welcome to Solar Network! Your account has been created successfully. Don't forget to check your email for activation instructions."
    )
    router.push("/login")
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'An error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>
