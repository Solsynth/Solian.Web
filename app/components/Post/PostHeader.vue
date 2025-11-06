<template>
  <div class="flex gap-3 items-center">
    <v-avatar :image="publisherAvatar" size="40" />
    <div class="flex-grow-1 flex flex-col">
      <p class="flex gap-1 items-baseline">
        <span class="font-bold">{{ props.item.publisher.nick }}</span>
        <span class="text-xs">@{{ props.item.publisher.name }}</span>
      </p>
      <p class="text-xs flex gap-1">
        <span>{{ DateTime.fromISO(props.item.createdAt).toRelative() }}</span>
        <span class="font-bold">·</span>
        <span>{{ DateTime.fromISO(props.item.createdAt).toLocaleString() }}</span>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { DateTime } from 'luxon'
import type { SnPost } from '~/types/api';

const props = defineProps<{ item: SnPost }>()

const apiBase = useSolarNetworkUrl();
const publisherAvatar = computed(() =>
  props.item.publisher.picture ? `${apiBase}/drive/files/${props.item.publisher.picture.id}` : undefined,
)
</script>
