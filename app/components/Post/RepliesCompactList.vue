<template>
  <n-card
    class="replies-compact-list"
    embedded
    title="Replies"
    prepend-icon="mdi-comment-text-multiple"
    size="small"
  >
    <!-- Error State -->
    <n-alert v-if="hasError" type="error" closable @click:close="refresh">
      {{ error }}
    </n-alert>

    <!-- Replies List -->
    <div class="flex flex-col gap-2">
      <template v-for="item in replies" :key="item.id">
        <div @click="router.push('/posts/' + item.id)">
          <div class="flex gap-3">
            <n-avatar :src="getPublisherAvatar(item)" :size="24" round />
            <article
              v-if="getHtmlContent(item)"
              class="prose prose-sm dark:prose-invert prose-slate prose-p:m-0 max-w-none flex-1"
            >
              <div v-html="getHtmlContent(item)" />
            </article>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <n-empty
        v-if="!replies || replies.length === 0"
        class="text-center py-8 text-muted-foreground"
        size="small"
      >
        No Replies
      </n-empty>
    </div>
  </n-card>
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
