<template>
  <div class="post-list">
    <!-- Error State -->
    <n-alert
      v-if="hasError"
      type="error"
      closable
      @close="refresh"
      class="mb-4"
    >
      {{ error }}
    </n-alert>

    <!-- Posts List -->
    <n-infinite-scroll :distance="0" @load="loadMore" style="overflow: auto">
      <template v-for="item in posts" :key="item.id">
        <post-item
          class="mb-4"
          :item="item"
          @react="
            (symbol, attitude, delta) =>
              $emit('react', item.id, symbol, attitude, delta)
          "
          @click="router.push('/posts/' + item.id)"
        />
      </template>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-4">
        <n-spin size="medium" />
      </div>

      <!-- Empty State -->
      <div
        v-if="!loading && posts.length === 0 && !hasError"
        class="text-center py-8 text-muted-foreground"
      >
        <n-icon :component="FileText" size="48" class="mb-2 opacity-50" />
        <p>No posts found</p>
      </div>
    </n-infinite-scroll>
  </div>
</template>

<script setup lang="ts">
import { usePostList } from "~/composables/usePostList"
import type { PostListParams } from "~/composables/usePostList"
import { FileText } from "lucide-vue-next"

import PostItem from "./PostItem.vue"

const router = useRouter()

const props = defineProps<{
  params?: PostListParams
}>()

defineEmits<{
  react: [postId: string, symbol: string, attitude: number, delta: number]
}>()

const { posts, hasError, error, loading, loadMore, refresh } = usePostList(
  props.params
)
</script>
