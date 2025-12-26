<template>
  <div v-if="loading" class="flex justify-center items-center py-4">
    <n-spin size="large" />
  </div>
  <div v-else-if="error" class="text-red-500 text-center py-4">
    {{ error }}
  </div>
  <post-item
    v-else-if="post"
    :item="post"
    :compact="compact"
    :flat="flat"
    :slim="slim"
    :show-referenced="showReferenced"
    @react="handleReaction"
  />
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from "vue"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import type { SnPost } from "~/types/api"
import PostItem from "./PostItem.vue"
import { keysToCamel } from "~/utils/transformKeys"

const props = withDefaults(
  defineProps<{
    postId: string
    showReferenced?: boolean
    compact?: boolean
    flat?: boolean
    slim?: boolean
  }>(),
  { showReferenced: true, compact: false, flat: false, slim: false }
)

const emit = defineEmits<{
  react: [symbol: string, attitude: number, delta: number]
  loaded: [post: SnPost]
}>()

const api = useSolarNetwork()
const post = ref<SnPost | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const fetchPost = async () => {
  if (!props.postId) {
    error.value = "No post ID provided"
    return
  }

  try {
    loading.value = true
    error.value = null
    
    const response = await api<SnPost>(`/sphere/posts/${props.postId}`, {
      method: "GET",
      onResponse({ response }) {
        if (response._data) {
          response._data = keysToCamel(response._data)
        }
      }
    })

    post.value = response
    emit("loaded", response)
  } catch (err) {
    console.error("Error fetching post:", err)
    error.value = err instanceof Error ? err.message : "Failed to fetch post"
  } finally {
    loading.value = false
  }
}

const handleReaction = (symbol: string, attitude: number, delta: number) => {
  emit("react", symbol, attitude, delta)
}

// Watch for postId changes and refetch
watch(
  () => props.postId,
  (newId) => {
    if (newId) {
      fetchPost()
    }
  },
  { immediate: true }
)

// Initial fetch on mount
onMounted(() => {
  if (props.postId) {
    fetchPost()
  }
})
</script>
