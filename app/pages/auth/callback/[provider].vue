<template>
  <div class="flex items-center justify-center h-compact-layout">
    <n-result
      status="info"
      title="Almost There"
      description="Please wait while we redirect you, it won't take too long..."
    >
      <template #icon>
        <span class="loading loading-spinner loading-xl"></span>
      </template>
    </n-result>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const provider = route.params.provider as string

const apiBase = useSolarNetworkUrl()

useHead({
  title: "Redirecting"
})

definePageMeta({
  layout: "minimal"
})

onMounted(() => {
  const redirectUrl = `${apiBase}/pass/auth/callback/${provider}${window.location.search}`
  window.location.href = redirectUrl
})
</script>
