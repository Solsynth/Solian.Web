<template>
  <v-card
    class="replies-compact-list"
    flat
    border
    title="Replies"
    prepend-icon="mdi-comment-text-multiple"
    density="compact"
  >
    <!-- Error State -->
    <v-alert
      v-if="hasError"
      type="error"
      class="mb-4"
      closable
      @click:close="refresh"
    >
      {{ error }}
    </v-alert>

    <!-- Replies List -->
    <div class="flex flex-col gap-2 pb-2.5">
      <template v-for="item in replies" :key="item.id">
        <v-sheet class="px-4" @click="router.push('/posts/' + item.id)">
          <div class="flex gap-3">
            <v-avatar :image="getPublisherAvatar(item)" size="24" border />
            <article
              v-if="getHtmlContent(item)"
              class="prose prose-sm dark:prose-invert prose-slate prose-p:m-0 max-w-none flex-1"
            >
              <div v-html="getHtmlContent(item)" />
            </article>
          </div>
        </v-sheet>
      </template>

      <!-- Empty State -->
      <div v-if="!replies || replies.length === 0" class="text-center py-8 text-muted-foreground">
        <v-icon
          icon="mdi-comment-outline"
          size="48"
          class="mb-2 opacity-50"
        />
        <p>No replies yet</p>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">

import { useRepliesList } from "~/composables/useRepliesList"
import { useMarkdownProcessor } from "~/composables/useMarkdownProcessor"
import type { RepliesListParams } from "~/composables/useRepliesList"
import type { SnPost } from "~/types/api"

const router = useRouter()

const props = defineProps<{
  params: RepliesListParams
  hideQuickReply?: boolean
}>()

defineEmits<{
  react: [postId: string, symbol: string, attitude: number, delta: number]
}>()

const { replies, hasError, error, refresh } = useRepliesList(props.params)

const apiBase = useSolarNetworkUrl()
const { render } = useMarkdownProcessor({ preserveEmptyLines: true })

const getPublisherAvatar = (item: SnPost) => {
  return item.publisher.picture
    ? `${apiBase}/drive/files/${item.publisher.picture.id}`
    : undefined
}

const getHtmlContent = (item: SnPost) => {
  return item.content ? render(item.content) : ""
}
</script>
