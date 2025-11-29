<template>
  <div class="flex flex-col items-center justify-center h-compact-layout">
    <div class="mb-4">
      <client-only>
        <captcha-widget @verified="onCaptchaVerified" />
      </client-only>
    </div>
    <div class="text-center">
      <div class="text-sm font-bold">Solar Network Anti-Robot</div>
      <p class="opacity-80 text-sm mb-2">
        You might need to wait a while before the puzzle fully loaded.
      </p>
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
