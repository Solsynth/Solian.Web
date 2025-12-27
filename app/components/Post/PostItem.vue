<template>
  <n-card>
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
        <div
          v-if="props.item.repliedPost || props.item.repliedGone"
          class="border rounded-xl mt-2"
        >
          <div class="p-2 flex items-center gap-2">
            <n-icon :component="ReplyIcon" class="ms-2" />
            <span class="font-bold">Replying to</span>
          </div>
          <div v-if="props.item.repliedGone" class="text-sm opacity-60">
            Post unavailable
          </div>
          <post-item
            v-else-if="props.item.repliedPost"
            :item="props.item.repliedPost"
            slim
            compact
            flat
            @react="handleReaction"
          />
        </div>

        <div
          v-if="props.item.forwardedPost || props.item.forwardedGone"
          class="border rounded-xl mt-2"
        >
          <div class="p-2 flex items-center gap-2">
            <n-icon :component="ForwardIcon" class="ms-2" />
            <span class="font-bold">Forwarded</span>
          </div>
          <div v-if="props.item.forwardedGone" class="text-sm opacity-60">
            Post unavailable
          </div>
          <post-item
            v-else-if="props.item.forwardedPost"
            :item="props.item.forwardedPost"
            slim
            compact
            flat
            @react="handleReaction"
          />
        </div>
      </template>

      <attachment-list
        v-if="!compact"
        :attachments="props.item.attachments"
        :max-height="640"
      />

      <div ref="repliesTarget">
        <replies-compact-list
          v-if="props.item.repliesCount && !compact && repliesVisible"
          :params="{ postId: props.item.id }"
          :hide-quick-reply="true"
          @react="handleReplyReaction"
        />
      </div>
      <div
        v-if="props.item.isTruncated"
        class="flex gap-2 text-xs opacity-80 items-center"
      >
        <span class="mdi mdi-dots-horizontal"></span>
        <p>Post truncated, tap to see details...</p>
      </div>

      <!-- Post Reactions -->
      <div class="flex gap-2">
        <n-tag type="success">
          <template #icon>
            <n-icon :component="ArrowUpIcon" />
          </template>
          {{ props.item.upvotes }}
        </n-tag>
        <n-tag type="error">
          <template #icon>
            <n-icon :component="ArrowDownIcon" />
          </template>
          {{ props.item.downvotes }}
        </n-tag>
      </div>
    </div>
  </n-card>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { useMarkdownProcessor } from "~/composables/useMarkdownProcessor"
import type { SnPost } from "~/types/api"
import { useIntersectionObserver } from "@vueuse/core"
import { ForwardIcon, ReplyIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-vue-next"

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

const repliesTarget = ref(null)
const repliesVisible = ref(false)

useIntersectionObserver(
  repliesTarget,
  (entries) => {
    const entry = entries[0]
    if (entry?.isIntersecting) {
      repliesVisible.value = true
    }
  },
  {
    threshold: 0.5
  }
)
</script>
