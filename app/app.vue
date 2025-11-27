<template>
  <naive-config>
    <n-dialog-provider>
      <n-notification-provider>
        <n-message-provider>
          <n-loading-bar-provider>
            <nuxt-loading-indicator />
            <nuxt-layout>
              <nuxt-page />
            </nuxt-layout>
          </n-loading-bar-provider>
        </n-message-provider>
      </n-notification-provider>
    </n-dialog-provider>
  </naive-config>
</template>

<script setup lang="ts">
import "@fontsource-variable/nunito"
import { usePreferredColorScheme } from "@vueuse/core"

const { colorModePreference } = useNaiveColorMode()
const colorScheme = usePreferredColorScheme()

colorModePreference.set("system")

onMounted(() => {
  switch (colorScheme.value) {
    case "dark":
      colorModePreference.set("dark")
    case "light":
      colorModePreference.set("light")
    default:
      colorModePreference.set("system")
  }
  colorModePreference.sync()
})
</script>
