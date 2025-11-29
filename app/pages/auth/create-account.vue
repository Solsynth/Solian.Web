<template>
  <div class="flex items-center justify-center h-screen-no-header px-4">
    <n-card class="w-full max-w-[1000px]" size="large">
      <div class="p-4 md:p-8">
        <div class="mb-4">
          <img :src="IconLight" alt="CloudyLamb" height="60" width="60" />
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="flex flex-col items-start justify-between">
            <div class="text-left h-auto">
              <Transition mode="out-in" name="slide-fade">
                <div v-if="stage === 'username-nick'" key="username-nick">
                  <h2 class="text-2xl font-bold mb-1">Create your account</h2>
                  <p class="text-lg">Start with your username and nickname</p>
                </div>
                <div v-else-if="stage === 'email'" key="email">
                  <h2 class="text-2xl font-bold mb-1">Add your email</h2>
                  <p class="text-lg">We'll use this for account verification</p>
                </div>
                <div v-else-if="stage === 'password'" key="password">
                  <h2 class="text-2xl font-bold mb-1">Set your password</h2>
                  <p class="text-lg">
                    Choose a strong password for your account
                  </p>
                </div>
                <div v-else-if="stage === 'captcha'" key="captcha">
                  <h2 class="text-2xl font-bold mb-1">Verify you're human</h2>
                  <p class="text-lg">
                    Complete the captcha to create your account
                  </p>
                </div>
                <div v-else-if="stage === 'terms'" key="terms">
                  <h2 class="text-2xl font-bold mb-1">Review Terms</h2>
                  <p class="text-lg">
                    Please review our terms and conditions before creating your
                    account.
                  </p>
                </div>
              </Transition>
            </div>
            <div v-if="isLoading" class="mb-4">
              <span class="loading loading-spinner loading-xl"></span>
            </div>
          </div>
          <div class="flex items-center justify-stretch">
            <div class="w-full flex flex-col md:text-right">
              <n-form
                ref="formRef"
                :model="formModel"
                :rules="rules"
                label-placement="top"
                class="w-full"
              >
                <!-- Stage 1: Username and Nickname -->
                <Transition mode="out-in" name="slide-fade">
                  <div v-if="stage === 'username-nick'" key="username-nick">
                    <n-form-item label="Username" path="name">
                      <n-input
                        size="large"
                        v-model:value="formModel.name"
                        placeholder="Username"
                        class="text-left"
                        @keydown.enter.prevent="handleNext"
                      />
                    </n-form-item>
                    <n-form-item label="Nickname" path="nick">
                      <n-input
                        size="large"
                        v-model:value="formModel.nick"
                        placeholder="Nickname"
                        class="text-left"
                        @keydown.enter.prevent="handleNext"
                      />
                    </n-form-item>
                    <div class="flex justify-between items-center mt-6">
                      <n-button text to="/auth/login">Login</n-button>
                      <n-button type="primary" size="large" @click="handleNext">
                        Next
                      </n-button>
                    </div>
                  </div>

                  <!-- Stage 2: Email -->
                  <div v-else-if="stage === 'email'" key="email">
                    <n-form-item label="Email" path="email">
                      <n-input
                        v-model:value="formModel.email"
                        placeholder="your@email.com"
                        size="large"
                        class="text-left"
                        @keydown.enter.prevent="handleNext"
                      />
                    </n-form-item>
                    <div class="flex justify-between items-center mt-6">
                      <div />
                      <n-button type="primary" size="large" @click="handleNext">
                        Next
                      </n-button>
                    </div>
                  </div>

                  <!-- Stage 3: Password -->
                  <div v-else-if="stage === 'password'" key="password">
                    <n-form-item label="Password" path="password">
                      <n-input
                        v-model:value="formModel.password"
                        type="password"
                        show-password-on="click"
                        placeholder="Enter your password"
                        class="text-left"
                        size="large"
                        @keydown.enter.prevent="handleNext"
                      />
                    </n-form-item>
                    <div class="flex justify-between items-center mt-6">
                      <div />
                      <n-button type="primary" size="large" @click="handleNext">
                        Next
                      </n-button>
                    </div>
                  </div>

                  <!-- Stage 4: Captcha -->
                  <div v-else-if="stage === 'captcha'" key="captcha">
                    <div class="flex justify-center mb-4">
                      <client-only>
                        <captcha-widget @verified="onCaptchaVerified" />
                      </client-only>
                    </div>
                  </div>

                  <!-- Stage 5: Terms -->
                  <div v-else-if="stage === 'terms'" key="terms">
                    <n-alert type="info" title="Things you need to know">
                      <ul class="list-decimal flex flex-col gap-1">
                        <li>
                          You can't have multiple accounts on the Solar Network,
                          that violates our Terms of Service.
                        </li>
                        <li>
                          You need go to your email to confirm your
                          registeration before you have permissions to do
                          something.
                        </li>
                        <li>
                          Feel free to contact our customer service at
                          <address>lily@solsynth.dev</address>
                        </li>
                        <li>
                          Make sure you agreed to our Terms and Service,
                          <nuxt-link
                            class="underline font-bold"
                            href="https://solsynth.dev/terms"
                            target="_blank"
                          >
                            check it out
                          </nuxt-link>
                        </li>
                      </ul>
                    </n-alert>

                    <div class="flex justify-between items-center mt-6">
                      <n-button text @click="stage = 'captcha'">Back</n-button>
                      <n-button
                        type="primary"
                        size="large"
                        @click="handleCreateAccount"
                      >
                        Create Account
                      </n-button>
                    </div>
                  </div>
                </Transition>
              </n-form>
            </div>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import CaptchaWidget from "~/components/CaptchaWidget.vue"
import type { FormInst, FormRules } from "naive-ui"

import IconLight from "~/assets/images/cloudy-lamb.png"

const router = useRouter()
const api = useSolarNetwork()

useHead({
  title: "Create Account"
})

const stage = ref<"username-nick" | "email" | "password" | "captcha" | "terms">(
  "username-nick"
)
const isLoading = ref(false)
const formRef = ref<FormInst | null>(null)

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

const message = useMessage()
const dialog = useDialog()

const rules: FormRules = {
  name: [
    {
      key: "name",
      required: true,
      message: "Name is required",
      trigger: ["input", "blur"]
    },
    {
      key: "name",
      min: 2,
      message: "Name must be at least 2 characters long",
      trigger: ["input", "blur"]
    },
    {
      key: "name",
      max: 256,
      message: "Name must be at most 256 characters long",
      trigger: ["input", "blur"]
    },
    {
      key: "name",
      pattern: /^[A-Za-z0-9_-]+$/,
      message:
        "Name can only contain letters, numbers, underscores, and hyphens.",
      trigger: ["input", "blur"]
    }
  ],
  nick: [
    {
      key: "nick",
      required: true,
      message: "Nick is required",
      trigger: ["input", "blur"]
    },
    {
      key: "nick",
      max: 256,
      message: "Nick must be at most 256 characters long",
      trigger: ["input", "blur"]
    }
  ],
  email: [
    {
      key: "email",
      required: true,
      message: "Email is required",
      trigger: ["input", "blur"]
    },
    {
      key: "email",
      max: 1024,
      message: "Email must be at most 1024 characters long",
      trigger: ["input", "blur"]
    },
    {
      key: "email",
      validator: (_rule, value: string) => {
        if (value.includes("+")) {
          return new Error("Email address cannot contain '+' symbol.")
        }
        if (!/.+@.+\..+/.test(value)) {
          return new Error("Please enter a valid email address")
        }
        return true
      },
      trigger: ["input", "blur"]
    }
  ],
  password: [
    {
      key: "password",
      required: true,
      message: "Password is required",
      trigger: ["input", "blur"]
    },
    {
      key: "password",
      min: 4,
      message: "Password must be at least 4 characters long",
      trigger: ["input", "blur"]
    },
    {
      key: "password",
      max: 128,
      message: "Password must be at most 128 characters long",
      trigger: ["input", "blur"]
    }
  ]
}

const onCaptchaVerified = (token: string) => {
  formModel.captchaToken = token
  stage.value = "terms"
}

async function handleNext() {
  if (!formRef.value) return

  try {
    if (stage.value === "username-nick") {
      await new Promise<void>((resolve, reject) => {
        formRef.value?.validate(
          (errors) => {
            if (errors) reject(new Error("Validation failed"))
            else resolve()
          },
          (rule) => rule.key === "name" || rule.key === "nick"
        )
      })
      stage.value = "email"
    } else if (stage.value === "email") {
      await new Promise<void>((resolve, reject) => {
        formRef.value?.validate(
          (errors) => {
            if (errors) reject(new Error("Validation failed"))
            else resolve()
          },
          (rule) => rule.key === "email"
        )
      })
      stage.value = "password"
    } else if (stage.value === "password") {
      await new Promise<void>((resolve, reject) => {
        formRef.value?.validate(
          (errors) => {
            if (errors) reject(new Error("Validation failed"))
            else resolve()
          },
          (rule) => rule.key === "password"
        )
      })
      stage.value = "captcha"
    }
  } catch {
    // Validation error, do nothing
  }
}

async function handleCreateAccount() {
  isLoading.value = true

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
    dialog.success({
      title: "Registration Completed",
      content:
        "Welcome to Solar Network! Your account has been created successfully. Don't forget to check your email for activation instructions.",
      onPositiveClick: () => {
        router.push("/auth/login")
      }
    })
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "An error occurred")
  } finally {
    isLoading.value = false
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
