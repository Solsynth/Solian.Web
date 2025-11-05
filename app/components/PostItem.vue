<template>
  <v-card class="px-4 py-3">
    <v-card-text>
      <div class="flex flex-col gap-3">
        <post-header :item="props.item" />

        <div v-if="props.item.title || props.item.description">
          <h2 v-if="props.item.title" class="text-lg">
            {{ props.item.title }}
          </h2>
          <p v-if="props.item.description" class="text-sm">
            {{ props.item.description }}
          </p>
        </div>

        <article
          v-if="htmlContent"
          class="prose prose-sm dark:prose-invert prose-slate prose-p:m-0 max-w-none"
        >
          <div v-html="htmlContent" />
        </article>

        <div
          v-if="props.item.attachments.length > 0"
          class="d-flex gap-2 flex-wrap"
          @click.stop
        >
          <attachment-item
            v-for="attachment in props.item.attachments"
            :key="attachment.id"
            :item="attachment"
          />
        </div>

        <!-- Post Reactions -->
        <div @click.stop>
          <post-reaction-list
            :parent-id="props.item.id"
            :reactions="props.item.reactionsCount"
            :reactions-made="props.item.reactionsMade"
            :can-react="true"
            @react="handleReaction"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { useMarkdownProcessor } from "~/composables/useMarkdownProcessor"
import type { SnPost } from "~/types/api"

import PostHeader from "./PostHeader.vue"
import AttachmentItem from "./AttachmentItem.vue"
import PostReactionList from "./PostReactionList.vue"

const props = defineProps<{ item: SnPost }>()
const emit = defineEmits<{
  react: [symbol: string, attitude: number, delta: number]
}>()

const { render } = useMarkdownProcessor()

const htmlContent = ref<string>("")

function handleReaction(symbol: string, attitude: number, delta: number) {
  emit('react', symbol, attitude, delta)
}

watch(
  props.item,
  (value) => {
    if (value.content)
      htmlContent.value = render(value.content)
  },
  { immediate: true, deep: true }
)
</script>
