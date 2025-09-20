<template>
  <div class="d-flex align-center justify-center fill-height">
    <v-card
      class="pa-6 text-center"
      max-width="600"
      title="Captcha Verification"
    >
      <v-card-text>
        <div class="mb-8 mt-4">
          <client-only>
            <captcha-widget @verified="onCaptchaVerified" />
          </client-only>
        </div>
        <div>
          <div class="text-sm font-bold mb-1">Solar Network Anti-Robot</div>
          <div class="opacity-80 text-xs">
            Hosted by
            <a
              href="https://github.com/Solsynth/DysonNetwork"
              class="text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              DysonNetwork.Sphere
            </a>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router"
import CaptchaWidget from "@/components/CaptchaWidget.vue"

const route = useRoute()

useHead({
  title: "Captcha Verification"
})

const onCaptchaVerified = (token: string) => {
  if (window.parent !== window) {
    window.parent.postMessage(`captcha_tk=${token}`, "*")
  }

  const redirectUri = route.query.redirect_uri as string
  if (redirectUri) {
    window.location.href = `${redirectUri}?captcha_tk=${encodeURIComponent(
      token
    )}`
  }
}

definePageMeta({
  layout: "minimal"
})
</script>
