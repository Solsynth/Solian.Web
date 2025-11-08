<template>
  <v-card :flat="props.flat">
    <v-card-text :style="props.slim ? 'padding: 0' : null">
      <div :class="['flex flex-col', compact ? 'gap-1' : 'gap-3']">
        <post-header :item="props.item" :compact="compact" />

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

        <template v-if="showReferenced">
          <div v-if="props.item.repliedPost || props.item.repliedGone">
            <v-card
              title="Replying to"
              prepend-icon="mdi-reply"
              density="compact"
              flat
              border
            >
              <div v-if="props.item.repliedGone" class="px-4 pb-3 text-sm opacity-60">
                Post unavailable
              </div>
              <post-item
                v-else-if="props.item.repliedPost"
                class="px-4 pb-3"
                :item="props.item.repliedPost"
                slim
                compact
                flat
                @react="handleReaction"
              />
            </v-card>
          </div>

          <div v-if="props.item.forwardedPost || props.item.forwardedGone">
            <v-card
              title="Forwarded"
              prepend-icon="mdi-forward"
              density="compact"
              flat
              border
            >
              <div v-if="props.item.forwardedGone" class="px-4 pb-3 text-sm opacity-60">
                Post unavailable
              </div>
              <post-item
                v-else-if="props.item.forwardedPost"
                class="px-4 pb-3"
                :item="props.item.forwardedPost"
                slim
                compact
                flat
                @react="handleReaction"
              />
            </v-card>
          </div>
        </template>

        <attachment-list
          v-if="!compact"
          :attachments="props.item.attachments"
          :max-height="640"
        />

        <v-lazy
          v-if="props.item.repliesCount && !compact"
          :options="{ threshold: 0.5 }"
          transition="fade-transition"
        >
          <replies-compact-list
            :params="{ postId: props.item.id }"
            :hide-quick-reply="true"
            @react="handleReplyReaction"
          />
        </v-lazy>
        <div
          v-if="props.item.isTruncated"
          class="flex gap-2 text-xs opacity-80"
        >
          <v-icon icon="mdi-dots-horizontal" size="small" />
          <p>Post truncated, tap to see details...</p>
        </div>

        <!-- Post Reactions -->
        <div v-if="!compact" @click.stop>
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

const props = withDefaults(
  defineProps<{
    item: SnPost
    showReferenced?: boolean
    compact?: boolean
    flat?: boolean
    slim?: boolean
  }>(),
  { showReferenced: true, compact: false, flat: false, slim: false }
)
const emit = defineEmits<{
  react: [symbol: string, attitude: number, delta: number]
}>()

const preserveEmptyLinesRef = ref(true) // New ref for the option

const { render } = useMarkdownProcessor({
  preserveEmptyLines: preserveEmptyLinesRef
})

const htmlContent = ref<string>("")

function handleReaction(symbol: string, attitude: number, delta: number) {
  emit("react", symbol, attitude, delta)
}

function handleReplyReaction(
  postId: string,
  symbol: string,
  attitude: number,
  delta: number
) {
  emit("react", symbol, attitude, delta)
}

watch(
  () => props.item, // Watch the item prop directly
  (value) => {
    preserveEmptyLinesRef.value = value.type !== 1 // Update the ref
    if (value.content) htmlContent.value = render(value.content)
  },
  { immediate: true, deep: true }
)
</script>
