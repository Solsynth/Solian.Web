<template>
  <v-container>
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate size="64" />
      <p class="mt-4">Loading post...</p>
    </div>
    <div v-else-if="error" class="text-center py-8">
      <v-alert type="error" class="mb-4">
        {{ error }}
      </v-alert>
    </div>
    <div v-else-if="post">
      <v-card class="mb-4">
        <v-card-text>
          <div class="flex flex-col gap-3">
            <post-header :item="post" />

            <div v-if="post.title || post.description">
              <h1 v-if="post.title" class="text-2xl font-bold">
                {{ post.title }}
              </h1>
              <p v-if="post.description" class="text-sm text-gray-600 dark:text-gray-400">
                {{ post.description }}
              </p>
            </div>

            <article
              v-if="htmlContent"
              class="prose prose-lg dark:prose-invert prose-slate prose-p:m-0 max-w-none"
            >
              <div v-html="htmlContent" />
            </article>

            <div v-if="post.attachments && post.attachments.length > 0" class="d-flex gap-2 flex-wrap mt-4">
              <attachment-item
                v-for="attachment in post.attachments"
                :key="attachment.id"
                :item="attachment"
              />
            </div>

            <div v-if="post.tags && post.tags.length > 0" class="mt-4">
              <v-chip
                v-for="tag in post.tags"
                :key="tag"
                size="small"
                variant="outlined"
                class="mr-2 mb-2"
              >
                {{ tag }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { Marked } from "marked"
import type { SnPost } from "~/types/api"

import PostHeader from "~/components/PostHeader.vue"
import AttachmentItem from "~/components/AttachmentItem.vue"

const route = useRoute()
const id = route.params.id as string

useHead({
  title: computed(() => {
    if (loading.value) return 'Loading post...'
    if (error.value) return 'Error'
    if (!post.value) return 'Post not found'
    return post.value.title || 'Post'
  }),
  meta: computed(() => {
    if (post.value) {
      const description = post.value.description || post.value.content?.substring(0, 150) || ''
      return [
        { name: 'description', content: description },
      ]
    }
    return []
  })
})

defineOgImage({
  title: computed(() => post.value?.title || 'Post'),
  description: computed(() => post.value?.description || post.value?.content?.substring(0, 150) || ''),
})

const post = ref<SnPost | null>(null)
const loading = ref(true)
const error = ref("")
const htmlContent = ref("")

const marked = new Marked()

async function fetchPost() {
  try {
    const api = useSolarNetwork()
    const resp = await api(`/sphere/posts/${id}`)
    post.value = resp as SnPost
    if (post.value.content) {
      htmlContent.value = await marked.parse(post.value.content, { breaks: true })
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load post"
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPost()
})
</script>
