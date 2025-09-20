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
              <div v-if="stage === 'username-nick'">
                <h2 class="text-2xl font-bold mb-1">Create your account</h2>
                <p class="text-lg">Start with your username and nickname</p>
              </div>
              <div v-if="stage === 'email'">
                <h2 class="text-2xl font-bold mb-1">Add your email</h2>
                <p class="text-lg">We'll use this for account verification</p>
              </div>
              <div v-if="stage === 'password'">
                <h2 class="text-2xl font-bold mb-1">Set your password</h2>
                <p class="text-lg">Choose a strong password for your account</p>
              </div>
              <div v-if="stage === 'captcha'">
                <h2 class="text-2xl font-bold mb-1">Verify you're human</h2>
                <p class="text-lg">
                  Complete the captcha to create your account
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
                <!-- Stage 1: Username and Nickname -->
                <v-window-item :value="0">
                  <v-text-field
                    v-model="formModel.name"
                    label="Username"
                    variant="outlined"
                    :rules="nameRules"
                    class="mb-2"
                    @keydown.enter="handleNext"
                  />
                  <v-text-field
                    v-model="formModel.nick"
                    label="Nickname"
                    variant="outlined"
                    :rules="nickRules"
                    class="mb-2"
                    @keydown.enter="handleNext"
                  />
                  <div class="d-flex justify-space-between align-center mt-6">
                    <v-btn
                      variant="text"
                      class="text-capitalize"
                      to="/auth/login"
                    >
                      Login
                    </v-btn>
                    <v-btn color="primary" size="large" @click="handleNext">
                      Next
                    </v-btn>
                  </div>
                </v-window-item>

                <!-- Stage 2: Email -->
                <v-window-item :value="1">
                  <v-text-field
                    v-model="formModel.email"
                    label="Email"
                    placeholder="your@email.com"
                    variant="outlined"
                    :rules="emailRules"
                    class="mb-2"
                    @keydown.enter="handleNext"
                  />
                  <div class="d-flex justify-space-between align-center mt-6">
                    <v-spacer />
                    <v-btn color="primary" size="large" @click="handleNext">
                      Next
                    </v-btn>
                  </div>
                </v-window-item>

                <!-- Stage 3: Password -->
                <v-window-item :value="2">
                  <v-text-field
                    v-model="formModel.password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    variant="outlined"
                    :rules="passwordRules"
                    class="mb-2"
                    @keydown.enter="handleNext"
                  />
                  <div class="d-flex justify-space-between align-center mt-6">
                    <v-spacer />
                    <v-btn color="primary" size="large" @click="handleNext">
                      Next
                    </v-btn>
                  </div>
                </v-window-item>

                <!-- Stage 4: Captcha -->
                <v-window-item :value="3">
                  <div class="d-flex justify-center mb-4">
                    <client-only>
                      <captcha-widget @verified="onCaptchaVerified" />
                    </client-only>
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

<script setup lang="ts">
import { ref, reactive, computed } from "vue"
import { useRouter } from "vue-router"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import CaptchaWidget from "~/components/CaptchaWidget.vue"

import IconLight from "~/assets/images/cloudy-lamb.png"
import IconDark from "~/assets/images/cloudy-lamb@dark.png"

const router = useRouter()
const api = useSolarNetwork()

const stage = ref<"username-nick" | "email" | "password" | "captcha">(
  "username-nick"
)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Computed for v-window active index
const activeStageIndex = computed(() => {
  switch (stage.value) {
    case "username-nick":
      return 0
    case "email":
      return 1
    case "password":
      return 2
    case "captcha":
      return 3
    default:
      return 0
  }
})

const formModel = reactive({
  name: "",
  nick: "",
  email: "",
  password: "",
  language: "en-us",
  captchaToken: ""
})

onMounted(() => {
  formModel.language = navigator.language
})

const nameRules = [
  (v: string) => !!v || "Name is required",
  (v: string) => v.length >= 2 || "Name must be at least 2 characters long",
  (v: string) => v.length <= 256 || "Name must be at most 256 characters long",
  (v: string) =>
    /^[A-Za-z0-9_-]+$/.test(v) ||
    "Name can only contain letters, numbers, underscores, and hyphens."
]

const nickRules = [
  (v: string) => !!v || "Nick is required",
  (v: string) => v.length <= 256 || "Nick must be at most 256 characters long"
]

const emailRules = [
  (v: string) => !!v || "Email is required",
  (v: string) =>
    v.length <= 1024 || "Email must be at most 1024 characters long",
  (v: string) =>
    /^[^+]+@[^@]+\.[^@]+$/.test(v) ||
    "Email address cannot contain '+' symbol.",
  (v: string) => /.+@.+\..+/.test(v) || "Please enter a valid email address"
]

const passwordRules = [
  (v: string) => !!v || "Password is required",
  (v: string) => v.length >= 4 || "Password must be at least 4 characters long",
  (v: string) =>
    v.length <= 128 || "Password must be at most 128 characters long"
]

const onCaptchaVerified = (token: string) => {
  formModel.captchaToken = token
  handleCreateAccount()
}

function handleNext() {
  error.value = null
  if (stage.value === "username-nick") {
    if (!formModel.name || !formModel.nick) {
      error.value = "Please fill in username and nickname"
      return
    }
    if (
      !nameRules.every(
        (rule) =>
          typeof rule(formModel.name) === "boolean" && rule(formModel.name)
      )
    ) {
      error.value = "Invalid username"
      return
    }
    if (
      !nickRules.every(
        (rule) =>
          typeof rule(formModel.nick) === "boolean" && rule(formModel.nick)
      )
    ) {
      error.value = "Invalid nickname"
      return
    }
    stage.value = "email"
  } else if (stage.value === "email") {
    if (!formModel.email) {
      error.value = "Please enter your email"
      return
    }
    if (
      !emailRules.every(
        (rule) =>
          typeof rule(formModel.email) === "boolean" && rule(formModel.email)
      )
    ) {
      error.value = "Invalid email"
      return
    }
    stage.value = "password"
  } else if (stage.value === "password") {
    if (!formModel.password) {
      error.value = "Please enter your password"
      return
    }
    if (
      !passwordRules.every(
        (rule) =>
          typeof rule(formModel.password) === "boolean" &&
          rule(formModel.password)
      )
    ) {
      error.value = "Invalid password"
      return
    }
    stage.value = "captcha"
  }
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
    router.push("/auth/login")
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "An error occurred"
  } finally {
    isLoading.value = false
  }
}
</script>
