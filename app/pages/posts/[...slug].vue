<template>
  <div class="py-6">
    <div v-if="pending" class="text-center py-12">
      <n-spin size="large" />
      <p class="mt-4">Loading post...</p>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <n-alert
        type="error"
        title="Error Loading Post"
        class="mb-4"
        :closable="false"
      >
        {{ error?.statusMessage || "Failed to load post" }}
      </n-alert>
    </div>

    <div v-else-if="post" class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <!-- Main Content Column -->
        <div class="lg:col-span-8 flex flex-col gap-4">
          <n-card class="pa-6">
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
                <n-icon size="16" name="mdi-calendar" />
                <span>{{ formatDate(post.createdAt) }}</span>
              </div>
              <div
                v-if="post.updatedAt && post.updatedAt !== post.createdAt"
                class="flex items-center gap-1"
              >
                <n-icon size="16" name="mdi-pencil" />
                <span>Updated {{ formatDate(post.updatedAt) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <n-icon size="16" name="mdi-eye" />
                <span>
                  {{ post.viewsTotal }} / {{ post.viewsUnique }}
                  views
                </span>
              </div>
            </div>
          </n-card>

          <n-card class="pa-6">
            <article
              v-if="htmlContent"
              class="prose dark:prose-invert prose-slate max-w-none mb-8"
              :class="classesContent"
            >
              <div v-html="htmlContent" />
            </article>

            <!-- Attachments within Content Section -->
            <attachment-list
              v-if="post.type != 1"
              :attachments="post.attachments || []"
            />
          </n-card>

          <n-card bordered>
            <template #header> Replies </template>
            <replies-list :params="{ postId: post.id }" />
          </n-card>
        </div>

        <!-- Sidebar Column -->
        <div class="lg:col-span-4 flex flex-col gap-4">
          <!-- Tags Section -->
          <n-card v-if="post.tags && post.tags.length > 0" bordered>
            <template #header> Tags & Categories </template>
            <div class="flex flex-wrap gap-2">
              <n-tag
                v-for="category in post.categories"
                :key="category.id"
                type="info"
                round
              >
                {{ category.slug }}
              </n-tag>
              <n-tag
                v-for="tag in post.tags"
                :key="tag.id"
                type="primary"
                round
              >
                {{ tag.slug }}
              </n-tag>
            </div>
          </n-card>

          <!-- Post Reactions -->
          <n-card class="elevation-1" bordered>
            <template #header> Reactions </template>
            <post-reaction-list
              can-react
              :parent-id="id"
              :reactions="(post as any).reactions || {}"
              :reactions-made="(post as any).reactionsMade || {}"
              @react="handleReaction"
            />
          </n-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue" // Added ref
import { useMarkdownProcessor } from "~/composables/useMarkdownProcessor"
import type { SnPost } from "~/types/api"

const route = useRoute()
const slugParts = route.params.slug as string[]
const id = slugParts.join("/")

const apiServer = useSolarNetwork()

const preserveEmptyLinesRef = ref(true) // New ref for the option

const { render } = useMarkdownProcessor({
  preserveEmptyLines: preserveEmptyLinesRef
})

const {
  data: postData,
  error,
  pending
} = await useAsyncData(`post-${id}`, async () => {
  try {
    const resp = await apiServer(`/sphere/posts/${id}`)
    const post = resp as SnPost

    // Update the ref based on post.type
    preserveEmptyLinesRef.value = post.type !== 1

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

if (postData.value?.post) {
  const p = postData.value.post
  if (p.publisher?.name && p.slug) {
    const slugUrl = `/posts/${p.publisher.name}/${p.slug}`
    if (route.path !== slugUrl) {
      await navigateTo(slugUrl, { redirectCode: 301 })
    }
  }
}

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
  }),
  link: computed(() => {
    if (post.value && post.value.publisher?.name && post.value.slug) {
      const slugUrl = `/posts/${post.value.publisher.name}/${post.value.slug}`
      return [{ rel: "canonical", href: slugUrl }]
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
    : post.value?.publisher.background
    ? `${apiBase}/drive/files/${post.value?.publisher.background.id}`
    : undefined
})

// defineOgImage block removed due to type incompatibility

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

onMounted(() => {
  setTimeout(() => makeEmbedImageClickable(), 100)
})

function makeEmbedImageClickable() {
  const elements = document.getElementsByClassName("prose-img-solar-network")
  let count = 0
  for (const element of elements) {
    if (element instanceof HTMLImageElement) {
      count += 1
      element.addEventListener("click", (evt) => {
        const targetImg = evt.target as HTMLImageElement
        window.open("/files/" + targetImg.src.split("/").findLast((_) => true))
      })
      element.style["cursor"] = "pointer"
    }
  }
  console.log(`[Article] Made ${count} image(s) clickable in the article.`)
}
</script>

<style>
.prose-img-solar-network img {
  border-radius: 8px;
}
</style>
