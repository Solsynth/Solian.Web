<template>
  <div class="post-list">
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

    <!-- Posts List -->
    <v-infinite-scroll
      height="auto"
      class="space-y-4"
      @load="loadMore"
    >
      <template v-for="item in posts" :key="item.id">
        <post-item
          :item="item"
          @react="(symbol, attitude, delta) => $emit('react', item.id, symbol, attitude, delta)"
        />
      </template>

      <!-- Loading State -->
      <template #loading>
        <div class="flex justify-center py-4">
          <v-progress-circular indeterminate size="32" />
        </div>
      </template>

      <!-- Empty State -->
      <template #empty>
        <div v-if="!posts" class="text-center py-8 text-muted-foreground">
          <v-icon icon="mdi-post-outline" size="48" class="mb-2 opacity-50" />
          <p>No posts found</p>
        </div>
      </template>
    </v-infinite-scroll>

    <!-- Refresh Button -->
    <div class="flex justify-center mt-4">
      <v-btn
        variant="outlined"
        :loading="isLoading"
        prepend-icon="mdi-refresh"
        @click="refresh"
      >
        Refresh
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePostList } from "~/composables/usePostList"
import type { PostListParams } from "~/composables/usePostList"

import PostItem from "./PostItem.vue"

const props = defineProps<{
  params?: PostListParams
}>()

defineEmits<{
  react: [postId: string, symbol: string, attitude: number, delta: number]
}>()

const { posts, isLoading, hasError, error, loadMore, refresh } =
  usePostList(props.params)
</script>
