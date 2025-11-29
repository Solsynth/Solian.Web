<template>
  <n-select
    :options="pubStore.publishers"
    label-field="nick"
    value-field="name"
    :value="props.value"
    @update:value="(v) => emits('update:value', v)"
    :render-label="renderLabel"
    :render-tag="renderTag"
  />
</template>

<script setup lang="ts">
import { usePubStore } from "~/stores/pub"
import { watch, h } from "vue"
import type { SelectRenderLabel, SelectRenderTag } from "naive-ui"
import type { SnPublisher } from "~/types/api"

const pubStore = usePubStore()
const apiBase = useSolarNetworkUrl()

const props = defineProps<{ value: string | undefined }>()
const emits = defineEmits(["update:value"])

const renderLabel: SelectRenderLabel = (option) => {
  return h("div", { class: "flex items-center" }, [
    h(NAvatar, {
      src: (option.value as SnPublisher)!.picture?.id
        ? `${apiBase}/drive/files/${(option.value as SnPublisher)!.picture!.id}`
        : undefined,
      size: "small",
      class: "mr-2"
    }),
    h("div", null, [
      h("div", null, option.nick as string),
      h("div", { class: "text-xs opacity-80" }, `@${option.name as string}`)
    ])
  ])
}

const renderTag: SelectRenderTag = ({ option }) => {
  return h(
    "div",
    {
      class: "flex items-center"
    },
    [
      h(NAvatar, {
        src: (option.value as SnPublisher)!.picture?.id
          ? `${apiBase}/drive/files/${
              (option.value as SnPublisher)!.picture!.id
            }`
          : undefined,
        size: "small",
        class: "mr-2"
      }),
      option.nick as string
    ]
  )
}

watch(
  pubStore,
  (value) => {
    if (!props.value && value.publishers) {
      emits("update:value", pubStore.publishers[0]?.name)
    }
  },
  { deep: true, immediate: true }
)
</script>
