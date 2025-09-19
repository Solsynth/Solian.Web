<template>
  <nuxt-layout>
    <nuxt-page />
  </nuxt-layout>
</template>

<script lang="ts">
import "~/assets/css/tailwind.css"

import "@mdi/font/css/materialdesignicons.css"

import { useUserStore } from "~/stores/user"

onMounted(() => {
  const userStore = useUserStore()
  userStore.fetchUser()
})
</script>
