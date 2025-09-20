<script setup lang="ts">
import { useOgImageRuntimeConfig } from "#og-image/app/utils"
import { useSiteConfig } from "#site-config/app/composables"
import { computed, defineComponent, h, resolveComponent } from "vue"

const props = defineProps({
  colorMode: { type: String, required: false },
  title: { type: String, required: false, default: "title" },
  description: { type: String, required: false },
  icon: { type: [String, Boolean], required: false },
  siteName: { type: String, required: false },
  siteLogo: { type: String, required: false },
  theme: { type: String, required: false, default: "#3f51b5" },
  backgroundImage: { type: String, required: false },
  avatarUrl: { type: String, required: false }
})
const HexRegex = /^#(?:[0-9a-f]{3}){1,2}$/i
const runtimeConfig = useOgImageRuntimeConfig()
const colorMode = computed(() => {
  return props.colorMode || runtimeConfig.colorPreference || "light"
})

const themeHex = computed(() => {
  if (HexRegex.test(props.theme)) return props.theme
  if (HexRegex.test(`#${props.theme}`)) return `#${props.theme}`
  if (props.theme.startsWith("rgb")) {
    const rgb = props.theme
      .replace("rgb(", "")
      .replace("rgba(", "")
      .replace(")", "")
      .split(",")
      .map((v) => Number.parseInt(v.trim(), 10))
    const hex = rgb
      .map((v) => {
        const hex2 = v.toString(16)
        return hex2.length === 1 ? `0${hex2}` : hex2
      })
      .join("")
    return `#${hex}`
  }
  return "#FFFFFF"
})
const themeRgb = computed(() => {
  return themeHex.value
    .replace("#", "")
    .match(/.{1,2}/g)
    ?.map((v) => Number.parseInt(v, 16))
    .join(", ")
})
const textShadow = computed(() => {
  return '2px 2px 8px rgba(0,0,0,0.8)'
})
const siteConfig = useSiteConfig()
const siteName = computed(() => {
  return props.siteName || siteConfig.name
})
const siteLogo = computed(() => {
  return props.siteLogo || siteConfig.logo
})
const IconComponent = runtimeConfig.hasNuxtIcon
  ? resolveComponent("Icon")
  : defineComponent({
      render() {
        return h("div", "missing @nuxt/icon")
      }
    })
if (
  typeof props.icon === "string" &&
  !runtimeConfig.hasNuxtIcon &&
  process.dev
) {
  console.warn(
    "Please install `@nuxt/icon` to use icons with the fallback OG Image component."
  )
  console.log("\nnpx nuxi module add icon\n")
}

const apiBaseServer = useSolarNetworkUrl(true)

function toAbsoluteUrl(url: string | undefined) {
  if (!url) return undefined
  if (url.startsWith("http"))
    return `${siteConfig.url}/__og/convert-image?url=${encodeURIComponent(url)}`
  if (url.startsWith("/api"))
    return `${siteConfig.url}/__og/convert-image?url=${encodeURIComponent(
      `${apiBaseServer}${url.replace("/api", "")}`
    )}`
  return `${siteConfig.url}${url}`
}
</script>

<template>
  <div
    class="w-full h-full flex justify-between relative text-white"
    :class="[
      ...(colorMode === 'light'
        ? ['bg-white']
        : ['bg-gray-900'])
    ]"
  >
    <div
      v-if="backgroundImage"
      class="absolute inset-0 w-full h-full"
      :class="colorMode === 'light' ? 'bg-white/80' : 'bg-gray-900/80'"
    />
    <img
      v-if="backgroundImage"
      :src="toAbsoluteUrl(backgroundImage)"
      class="absolute top-0 left-0 w-full h-full object-cover"
      style="min-width: 1200px; min-height: 600px; filter: blur(8px)"
    />
    <div class="h-full w-full justify-between relative p-[60px]">
      <div class="flex flex-row justify-between items-start">
        <div class="flex flex-col w-full max-w-[65%]">
          <h1
            class="m-0 font-bold mb-[30px] text-[75px]"
            style="display: block; text-overflow: ellipsis"
            :style="{ lineClamp: description ? 2 : 3, textShadow }"
          >
            {{ title }}
          </h1>
          <p
            v-if="description"
            class="text-[35px] leading-12 text-white"
            style="display: block; line-clamp: 3; text-overflow: ellipsis"
            :style="{ textShadow }"
          >
            {{ description }}
          </p>
        </div>
        <div v-if="Boolean(icon)" style="width: 30%" class="flex justify-end">
          <IconComponent
            :name="icon"
            size="250px"
            style="margin: 0 auto; opacity: 0.7"
          />
        </div>
      </div>
      <div class="flex flex-row justify-end items-center text-right gap-3 w-full">
        <p v-if="siteName" style="font-size: 25px" class="font-bold" :style="{ textShadow }">
          {{ siteName }}
        </p>
        <img
          v-if="avatarUrl"
          :src="toAbsoluteUrl(avatarUrl)"
          height="60"
          width="60"
          class="rounded-full mr-4"
        />
      </div>
    </div>
  </div>
</template>
