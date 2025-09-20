<template>
  <nuxt-layout>
    <nuxt-page />
  </nuxt-layout>
</template>

<script lang="ts">
onMounted(() => {
  const userStore = useUserStore()
  userStore.fetchUser()
})
</script>
