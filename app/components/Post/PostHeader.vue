<template>
  <div :class="['flex gap-3 items-center', { 'gap-2': compact }]">
    <v-avatar :image="publisherAvatar" :size="compact ? 24 : 40" :border="compact" />
    <div class="grow flex flex-col">
      <p v-if="compact" class="flex gap-1 items-baseline text-sm">
        <span class="font-bold">{{ props.item.publisher.nick }}</span>
        <span class="text-xs opacity-80">{{ DateTime.fromISO(props.item.createdAt).toRelative() }}</span>
      </p>
      <template v-else>
        <p class="flex gap-1 items-baseline">
          <span class="font-bold">{{ props.item.publisher.nick }}</span>
          <span class="text-xs">@{{ props.item.publisher.name }}</span>
        </p>
        <p class="text-xs flex gap-1">
          <span>{{ DateTime.fromISO(props.item.createdAt).toRelative() }}</span>
          <span class="font-bold">·</span>
          <span>{{ DateTime.fromISO(props.item.createdAt).toLocaleString() }}</span>
        </p>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { DateTime } from 'luxon'
import type { SnPost } from '~/types/api';

const props = withDefaults(defineProps<{ item: SnPost, compact?: boolean }>(), { compact: false })

const apiBase = useSolarNetworkUrl();
const publisherAvatar = computed(() =>
  props.item.publisher.picture ? `${apiBase}/drive/files/${props.item.publisher.picture.id}` : undefined,
)
</script>
