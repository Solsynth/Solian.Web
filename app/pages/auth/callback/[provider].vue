<template>
  <div class="d-flex align-center justify-center fill-height">
    <v-card class="pa-6 text-center" max-width="400">
      <v-card-text>
        <v-progress-circular indeterminate color="primary" class="mb-4" />
        <h2 class="text-xl font-bold">Redirecting...</h2>
        <p class="opacity-80">Please wait while we redirect you.</p>
      </v-card-text>
    </v-card>
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
  const redirectUrl = `${apiBase}/id/auth/callback/${provider}${window.location.search}`
  window.location.href = redirectUrl
})
</script>
