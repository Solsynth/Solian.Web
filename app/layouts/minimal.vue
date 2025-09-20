<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <v-app-bar flat height="48">
      <v-container class="mx-auto d-flex align-center justify-center">
        <p class="text-sm">Solar Network</p>
      </v-container>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { useCustomTheme } from "~/composables/useCustomTheme"

const { isDark } = useCustomTheme()
</script>
