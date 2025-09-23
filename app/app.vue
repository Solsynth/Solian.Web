<template>
  <nuxt-loading-indicator :color="colorMode.value == 'dark' ? 'white' : '#3f51b5'" />
  <nuxt-layout>
    <nuxt-page />
  </nuxt-layout>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
</script>
