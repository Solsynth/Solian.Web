<template>
  <n-card>
    <div class="flex flex-col justify-center gap-4">
      <img
        v-if="userBackground"
        :src="userBackground"
        style="aspect-ratio: 16/7"
        class="rounded-xl"
      />
      <div class="flex items-center gap-4">
        <n-avatar :src="userPicture" />
        <div class="grow">
          <div class="font-bold text-lg">{{ data.nick }}</div>
          <div class="text-sm opacity-80">@{{ data.name }}</div>
        </div>
        <div><slot name="suffix" /></div>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import type { SnPublisher } from "~/types/api"

const props = defineProps<{ data: SnPublisher }>()
const _ = defineSlots<{ suffix(): unknown }>()

const apiBase = useSolarNetworkUrl()

const userPicture = computed(() => {
  return props.data.picture
    ? `${apiBase}/drive/files/${props.data.picture.id}`
    : undefined
})

const userBackground = computed(() => {
  return props.data.background
    ? `${apiBase}/drive/files/${props.data.background.id}`
    : undefined
})
</script>
