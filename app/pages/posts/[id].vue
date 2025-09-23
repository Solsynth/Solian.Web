<template>
  <v-container class="py-6">
    <div v-if="pending" class="text-center py-12">
      <v-progress-circular indeterminate size="64" color="primary" />
      <p class="mt-4">Loading post...</p>
    </div>
    <div v-else-if="error" class="text-center py-12">
      <v-alert type="error" class="mb-4" prominent>
        <v-alert-title>Error Loading Post</v-alert-title>
        {{ error?.statusMessage || "Failed to load post" }}
      </v-alert>
    </div>
    <div v-else-if="post" class="max-w-4xl mx-auto">
      <!-- Article Type: Split Header and Content -->
      <template v-if="post.type === 1">
        <!-- Post Header Section (Article) -->
        <v-card class="mb-4 elevation-2" rounded="lg">
          <v-card-text class="pa-6">
            <post-header :item="post" class="mb-4" />

            <!-- Post Title and Description -->
            <div v-if="post.title || post.description" class="mb-4">
              <h1
                v-if="post.title"
                class="text-3xl font-bold mb-3 leading-tight"
              >
                {{ post.title }}
              </h1>
              <p
                v-if="post.description"
                class="text-lg text-medium-emphasis leading-relaxed"
              >
                {{ post.description }}
              </p>
            </div>

            <!-- Post Metadata -->
            <div class="flex items-center gap-4 text-sm text-medium-emphasis">
              <div class="flex items-center gap-1">
                <v-icon size="16">mdi-calendar</v-icon>
                <span>{{ formatDate(post.createdAt) }}</span>
              </div>
              <div
                v-if="post.updatedAt && post.updatedAt !== post.createdAt"
                class="flex items-center gap-1"
              >
                <v-icon size="16">mdi-pencil</v-icon>
                <span>Updated {{ formatDate(post.updatedAt) }}</span>
              </div>
              <div
                v-if="(post as any).viewCount || (post as any).view_count"
                class="flex items-center gap-1"
              >
                <v-icon size="16">mdi-eye</v-icon>
                <span
                  >{{
                    (post as any).viewCount || (post as any).view_count || 0
                  }}
                  views</span
                >
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Merged Content and Attachments Section (Article) -->
        <v-card class="mb-4 elevation-1" rounded="lg">
          <v-card-text class="pa-8">
            <article
              v-if="htmlContent"
              class="prose prose-xl dark:prose-invert prose-slate max-w-none mb-8"
            >
              <div v-html="htmlContent" />
            </article>

            <!-- Attachments within Content Section -->
            <div v-if="post.attachments && post.attachments.length > 0">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <attachment-item
                  v-for="attachment in post.attachments"
                  :key="attachment.id"
                  :item="attachment"
                  class="w-full"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </template>

      <!-- Other Types: Merged Header, Content, and Attachments -->
      <template v-else>
        <!-- Merged Header, Content, and Attachments Section -->
        <v-card class="px-4 py-3 mb-4 elevation-1" rounded="lg">
          <v-card-text class="pa-6">
            <post-header :item="post" class="mb-4" />

            <!-- Post Title and Description -->
            <div v-if="post.title || post.description" class="mb-4">
              <h1
                v-if="post.title"
                class="text-3xl font-bold mb-3 leading-tight"
              >
                {{ post.title }}
              </h1>
              <p
                v-if="post.description"
                class="text-lg text-medium-emphasis leading-relaxed"
              >
                {{ post.description }}
              </p>
            </div>

            <!-- Post Metadata -->
            <div
              class="flex items-center gap-4 text-sm text-medium-emphasis mb-4"
            >
              <div class="flex items-center gap-1">
                <v-icon size="16">mdi-calendar</v-icon>
                <span>{{ formatDate(post.createdAt) }}</span>
              </div>
              <div
                v-if="post.updatedAt && post.updatedAt !== post.createdAt"
                class="flex items-center gap-1"
              >
                <v-icon size="16">mdi-pencil</v-icon>
                <span>Updated {{ formatDate(post.updatedAt) }}</span>
              </div>
              <div
                v-if="(post as any).viewCount || (post as any).view_count"
                class="flex items-center gap-1"
              >
                <v-icon size="16">mdi-eye</v-icon>
                <span
                  >{{
                    (post as any).viewCount || (post as any).view_count || 0
                  }}
                  views</span
                >
              </div>
            </div>

            <!-- Main Content -->
            <article
              v-if="htmlContent"
              class="prose prose-xl dark:prose-invert prose-slate max-w-none mb-8"
            >
              <div v-html="htmlContent" />
            </article>

            <!-- Attachments within Merged Section -->
            <div v-if="post.attachments && post.attachments.length > 0">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <attachment-item
                  v-for="attachment in post.attachments"
                  :key="attachment.id"
                  :item="attachment"
                  class="w-full"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </template>

      <!-- Tags Section -->
      <v-card
        v-if="post.tags && post.tags.length > 0"
        class="mb-4 elevation-1"
        rounded="lg"
      >
        <v-card-title class="text-h6">
          <v-icon class="mr-2">mdi-tag-multiple</v-icon>
          Tags
        </v-card-title>
        <v-card-text>
          <div class="flex flex-wrap gap-2">
            <v-chip
              v-for="tag in post.tags"
              :key="tag"
              size="small"
              variant="outlined"
              color="primary"
              class="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <v-icon start size="16">mdi-tag</v-icon>
              {{ tag }}
            </v-chip>
          </div>
        </v-card-text>
      </v-card>

      <!-- Post Reactions -->
      <div>
        <post-reaction-list
          can-react
          :parent-id="id"
          :reactions="(post as any).reactions || {}"
          :reactions-made="(post as any).reactionsMade || {}"
          @react="handleReaction"
        />
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import type { SnPost } from "~/types/api"

import PostHeader from "~/components/PostHeader.vue"
import AttachmentItem from "~/components/AttachmentItem.vue"
import PostReactionList from "~/components/PostReactionList.vue"

const route = useRoute()
const id = route.params.id as string

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkBreaks)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeStringify)

const apiServer = useSolarNetwork(true)

const {
  data: postData,
  error,
  pending
} = await useAsyncData(`post-${id}`, async () => {
  try {
    const resp = await apiServer(`/sphere/posts/${id}`)
    const post = resp as SnPost
    let html = ""
    if (post.content) {
      html = String(processor.processSync(post.content))
    }
    return { post, html }
  } catch (e) {
    throw createError({
      statusCode: 404,
      statusMessage: e instanceof Error ? e.message : "Failed to load post"
    })
  }
})

const post = computed(() => postData.value?.post || null)
const htmlContent = computed(() => postData.value?.html || "")

useHead({
  title: computed(() => {
    if (pending.value) return "Loading post..."
    if (error.value) return "Error"
    if (!post.value) return "Post not found"
    return `${post.value?.title || "Post"} from ${post.value?.publisher.nick}`
  }),
  meta: computed(() => {
    if (post.value) {
      const description =
        post.value.description || post.value.content?.substring(0, 150) || ""
      return [{ name: "description", content: description }]
    }
    return []
  })
})

const apiBase = useSolarNetworkUrl()

const userPicture = computed(() => {
  return post.value?.publisher.picture
    ? `${apiBase}/drive/files/${post.value.publisher.picture.id}`
    : undefined
})
const userBackground = computed(() => {
  const firstImageAttachment = post.value?.attachments?.find((att) =>
    att.mimeType?.startsWith("image/")
  )
  return firstImageAttachment
    ? `${apiBase}/drive/files/${firstImageAttachment.id}`
    : undefined
})

defineOgImage({
  component: "ImageCard",
  title: computed(() => post.value?.title || "Post"),
  description: computed(
    () =>
      post.value?.description || post.value?.content?.substring(0, 150) || ""
  ),
  avatarUrl: computed(() => userPicture.value),
  backgroundImage: computed(() => userBackground.value)
})

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
}

function handleReaction(symbol: string, attitude: number, delta: number) {
  if (!post.value) return

  // Update the reactions count
  const reactions = (post.value as any).reactions || {}
  const currentCount = reactions[symbol] || 0
  const newCount = Math.max(0, currentCount + delta)

  if (newCount === 0) {
    delete reactions[symbol]
  } else {
    reactions[symbol] = newCount
  }

  // Update the reactionsMade status
  const reactionsMade = (post.value as any).reactionsMade || {}
  if (delta > 0) {
    reactionsMade[symbol] = true
  } else {
    delete reactionsMade[symbol]
  }

  // Update the post object
  ;(post.value as any).reactions = reactions
  ;(post.value as any).reactionsMade = reactionsMade
}
</script>
