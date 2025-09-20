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

        <div v-if="props.item.attachments.length > 0" class="d-flex gap-2 flex-wrap" @click.stop>
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
            :reactions="(props.item as any).reactions || {}"
            :reactions-made="(props.item as any).reactionsMade || {}"
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
import { Marked } from "marked"
import type { SnPost } from "~/types/api"

import PostHeader from "./PostHeader.vue"
import AttachmentItem from "./AttachmentItem.vue"
import PostReactionList from "./PostReactionList.vue"

const props = defineProps<{ item: SnPost }>()

const marked = new Marked()

const htmlContent = ref<string>("")

function handleReaction(symbol: string, attitude: number, delta: number) {
  // Update the local item data
  if (!props.item) return

  const reactions = (props.item as any).reactions || {}
  const currentCount = reactions[symbol] || 0
  const newCount = Math.max(0, currentCount + delta)

  if (newCount === 0) {
    delete reactions[symbol]
  } else {
    reactions[symbol] = newCount
  }

  // Update the reactionsMade status
  const reactionsMade = (props.item as any).reactionsMade || {}
  if (delta > 0) {
    reactionsMade[symbol] = true
  } else {
    delete reactionsMade[symbol]
  }

  // Update the item object (this will trigger reactivity)
  ;(props.item as any).reactions = { ...reactions }
  ;(props.item as any).reactionsMade = { ...reactionsMade }
}

watch(
  props.item,
  async (value) => {
    if (value.content)
      htmlContent.value = await marked.parse(value.content, { breaks: true })
  },
  { immediate: true, deep: true }
)
</script>
