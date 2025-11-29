<template>
  <n-config-provider :theme-overrides="{ common: { borderRadius: '8px' } }">
    <n-select
      :options="pubStore.publishers"
      label-field="nick"
      value-field="name"
      :value="props.value"
      @update:value="(v) => emits('update:value', v)"
      :render-label="renderLabel"
      :render-tag="renderTag"
    />
  </n-config-provider>
</template>

<script setup lang="ts">
import { usePubStore } from "~/stores/pub"
import { watch, h } from "vue"
import type { SelectRenderLabel, SelectRenderTag } from "naive-ui"

const pubStore = usePubStore()
const apiBase = useSolarNetworkUrl()

const props = defineProps<{ value: string | undefined }>()
const emits = defineEmits(["update:value"])

const renderLabel: SelectRenderLabel = (option) => {
  const pubData = pubStore.publishers.filter((p) => p.id == option.id)[0]
  return h("div", { class: "flex items-center" }, [
    h(NAvatar, {
      round: true,
      src: pubData?.picture?.id
        ? `${apiBase}/drive/files/${pubData.picture!.id}`
        : undefined,
      size: "small",
      class: "mr-2"
    }),
    h("div", null, [
      h("div", null, pubData!.nick),
      h("div", { class: "text-xs opacity-80" }, `@${pubData!.name as string}`)
    ])
  ])
}

const renderTag: SelectRenderTag = ({ option }) => {
  const pubData = pubStore.publishers.filter((p) => p.id == option.id)[0]
  return h(
    "div",
    {
      class: "flex items-center"
    },
    [
      h(NAvatar, {
        round: true,
        src: pubData?.picture?.id
          ? `${apiBase}/drive/files/${pubData.picture!.id}`
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
