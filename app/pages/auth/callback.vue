<template>
  <div class="d-flex align-center justify-center fill-height">
    <v-card class="pa-6 text-center" max-width="400">
      <v-card-text>
        <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
        <h2 class="text-xl font-bold">Auth completed</h2>
        <p class="opacity-80">Now you can close this tab</p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "minimal"
})
</script>
