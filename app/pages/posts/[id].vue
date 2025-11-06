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

    <div v-else-if="post" class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <!-- Main Content Column -->
        <div class="lg:col-span-8 flex flex-col gap-4">
          <v-card class="pa-6">
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
              <div class="flex items-center gap-1">
                <v-icon size="16">mdi-eye</v-icon>
                <span>
                  {{ post.viewsTotal }} / {{ post.viewsUnique }}
                  views
                </span>
              </div>
            </div>
          </v-card>

          <v-card class="pa-6">
            <article
              v-if="htmlContent"
              class="prose dark:prose-invert prose-slate max-w-none mb-8"
              :class="classesContent"
            >
              <div v-html="htmlContent" />
            </article>

            <!-- Attachments within Content Section -->
            <attachment-list :attachments="post.attachments || []" />
          </v-card>

          <v-card title="Replies" prepend-icon="mdi-comment-text-multiple" color="transparent" flat>
            <replies-list :params="{ postId: post.id }" />
          </v-card>
        </div>

        <!-- Sidebar Column -->
        <div class="lg:col-span-4 flex flex-col gap-4">
          <!-- Tags Section -->
          <v-card
            v-if="post.tags && post.tags.length > 0"
            rounded="lg"
            prepend-icon="mdi-tag-multiple"
            title="Tags & Categories"
          >
            <v-card-text>
              <div class="flex flex-wrap gap-2">
                <v-chip
                  v-for="category in post.categories"
                  :key="category.id"
                  prepend-icon="mdi-tshape"
                  rounded
                >
                  {{ category.slug }}
                </v-chip>
                <v-chip
                  v-for="tag in post.tags"
                  :key="tag.id"
                  prepend-icon="mdi-tag"
                  rounded
                >
                  {{ tag.slug }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Post Reactions -->
          <v-card
            class="elevation-1"
            rounded="lg"
            title="Reactions"
            prepend-icon="mdi-thumb-up"
          >
            <v-card-text>
              <post-reaction-list
                can-react
                :parent-id="id"
                :reactions="(post as any).reactions || {}"
                :reactions-made="(post as any).reactionsMade || {}"
                @react="handleReaction"
              />
            </v-card-text>
          </v-card>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useMarkdownProcessor } from "~/composables/useMarkdownProcessor"
import type { SnPost } from "~/types/api"

const route = useRoute()
const id = route.params.id as string

const { render } = useMarkdownProcessor()

const apiServer = useSolarNetwork()

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
      html = render(post.content)
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

const classesContent = computed(() =>
  postData.value?.post.type == 1 ? "prose-xl" : "prose-md"
)

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
  const reactions = post.value.reactionsCount || {}
  const currentCount = reactions[symbol] || 0
  const newCount = Math.max(0, currentCount + delta)

  if (newCount === 0) {
    delete reactions[symbol]
  } else {
    reactions[symbol] = newCount
  }

  // Update the reactionsMade status
  const reactionsMade = post.value.reactionsMade || {}
  if (delta > 0) {
    reactionsMade[symbol] = true
  } else {
    delete reactionsMade[symbol]
  }

  // Update the post object
  post.value.reactionsCount = reactions
  post.value.reactionsMade = reactionsMade
}
</script>
