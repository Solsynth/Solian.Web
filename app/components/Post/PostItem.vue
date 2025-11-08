<template>
  <v-card>
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

        <attachment-list
          :attachments="props.item.attachments"
          :max-height="640"
        />

        <div
          v-if="props.item.repliesCount"
          class="flex gap-2 text-xs opacity-80"
        >
          <v-icon icon="mdi-comment-text-multiple" size="small" />
          <p>{{ props.item.repliesCount }} replies</p>
        </div>
        <div
          v-if="props.item.isTruncated"
          class="flex gap-2 text-xs opacity-80"
        >
          <v-icon icon="mdi-dots-horizontal" size="small" />
          <p>Post truncated, tap to see details...</p>
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

const props = defineProps<{ item: SnPost }>()
const emit = defineEmits<{
  react: [symbol: string, attitude: number, delta: number]
}>()

const { render } = useMarkdownProcessor()

const htmlContent = ref<string>("")

function handleReaction(symbol: string, attitude: number, delta: number) {
  emit("react", symbol, attitude, delta)
}

watch(
  props.item,
  (value) => {
    if (value.content) htmlContent.value = render(value.content)
  },
  { immediate: true, deep: true }
)
</script>
