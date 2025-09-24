<template>
  <div id="swagger-ui"></div>
</template>

<script lang="ts" setup>
// @ts-ignore
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from "swagger-ui-dist"
import "swagger-ui-dist/swagger-ui.css"

const colorMode = useColorMode()

onMounted(() => {
  // Load theme once on page load
  loadTheme(colorMode.value)

  // Reactively switch if user toggles mode
  watch(colorMode, (newVal) => {
    loadTheme(newVal.value)
  })
})

function loadTheme(mode: string) {
  if (mode === "dark") {
    import("swagger-themes/themes/one-dark.css")
  } else {
    import("swagger-themes/themes/material.css")
  }
}

const apiBase = useSolarNetworkUrl(true)

onMounted(() => {
  const ui = SwaggerUIBundle({
    urls: [
      {
        url: `${apiBase}/swagger/ring/v1/swagger.json`,
        name: "DysonNetwork.Ring"
      },
      {
        url: `${apiBase}/swagger/pass/v1/swagger.json`,
        name: "DysonNetwork.Pass"
      },
      {
        url: `${apiBase}/swagger/sphere/v1/swagger.json`,
        name: "DysonNetwork.Sphere"
      },
      {
        url: `${apiBase}/swagger/drive/v1/swagger.json`,
        name: "DysonNetwork.Drive"
      },
      {
        url: `${apiBase}/swagger/develop/v1/swagger.json`,
        name: "DysonNetwork.Develop"
      }
    ],
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: "StandaloneLayout"
  })
  // @ts-ignore
  window.ui = ui
})

definePageMeta({
  layout: "minimal"
})

useHead({
  title: "Solar Network API"
})
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap");

.swagger-ui *:not(:is(pre, pre *, textarea, textarea *)) {
  font-family: var(--font-family) !important;
}

.swagger-ui pre,
.swagger-ui pre *,
.swagger-ui textarea,
.swagger-ui textarea * {
  font-family: "IBM Plex Mono", monospace !important;
}
</style>
