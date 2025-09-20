<template>
  <nuxt-layout>
    <nuxt-page />
  </nuxt-layout>
</template>

<script lang="ts">
import "@mdi/font/css/materialdesignicons.css"

import "~/assets/css/tailwind.css"

onMounted(() => {
  const userStore = useUserStore()
  userStore.fetchUser()
})
</script>
