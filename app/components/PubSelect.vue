<template>
  <v-select
    :items="pubStore.publishers"
    item-title="nick"
    item-value="name"
    :model-value="props.value"
    @update:model-value="(v) => emits('update:value', v)"
  >
    <template #item="{ props: itemProps, item }">
      <v-list-item v-bind="itemProps">
        <template #prepend>
          <v-avatar
            :image="item.raw.picture ? `${apiBase}/api/drive/files/${item.raw.picture.id}` : undefined"
            size="small"
            rounded
          />
        </template>
        <v-list-item-title>{{ item.raw?.nick }}</v-list-item-title>
        <v-list-item-subtitle>@{{ item.raw?.name }}</v-list-item-subtitle>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <div class="d-flex align-center">
        <v-avatar
          :image="item.raw.picture ? `${apiBase}/api/drive/files/${item.raw.picture.id}` : undefined"
          size="24"
          rounded
          class="me-2"
        />
        {{ item.raw?.nick }}
      </div>
    </template>
  </v-select>
</template>

<script setup lang="ts">
import { usePubStore } from '~/stores/pub'
import { watch } from 'vue'

const pubStore = usePubStore()
const apiBase = useSolarNetworkUrl()

const props = defineProps<{ value: string | undefined }>()
const emits = defineEmits(['update:value'])

watch(
  pubStore,
  (value) => {
    if (!props.value && value.publishers) {
      emits('update:value', pubStore.publishers[0]?.name)
    }
  },
  { deep: true, immediate: true },
)
</script>
