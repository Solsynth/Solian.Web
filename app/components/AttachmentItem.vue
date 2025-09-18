<template>
  <img v-if="itemType == 'image'" :src="remoteSource" class="rounded-md">
  <audio v-else-if="itemType == 'audio'" :src="remoteSource" controls />
  <video v-else-if="itemType == 'video'" :src="remoteSource" controls />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { SnAttachment } from '~/types/api'

const props = defineProps<{ item: SnAttachment }>()

const itemType = computed(() => props.item.mime_type.split('/')[0] ?? 'unknown')

const apiBase = useSolarNetworkUrl();
const remoteSource = computed(() => `${apiBase}/drive/files/${props.item.id}?original=true`)
</script>
