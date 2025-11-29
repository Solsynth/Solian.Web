<template>
  <div class="flex items-center justify-center h-compact-layout">
    <n-result
      status="success"
      title="Auth Completed"
      description="Now you can close this tab safely."
    ></n-result>
  </div>
</template>

<script lang="ts" setup>
useHead({
  title: "Auth Completed"
})

definePageMeta({
  layout: "minimal"
})

const route = useRoute()

onMounted(() => {
  if (route.query.token || route.query.challenge) {
    // Goes to the client
    window.location.href = `solian://auth/callback${window.location.search}`
  }
})
</script>
