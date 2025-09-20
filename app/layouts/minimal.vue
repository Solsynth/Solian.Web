<template>
  <v-app :theme="colorMode.preference">
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
const colorMode = useColorMode()
</script>
