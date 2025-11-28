<template>
  <div class="replies-list">
    <post-quick-reply v-if="!props.hideQuickReply" class="mb-4" />

    <!-- Error State -->
    <n-alert
      v-if="hasError"
      type="error"
      class="mb-4"
      :closable="true"
      @close="refresh"
    >
      {{ error }}
    </n-alert>

    <!-- Replies List -->
    <n-infinite-scroll
      class="flex flex-col gap-4 mt-0"
      :distance="10"
      @load="loadMore"
    >
      <template v-for="item in replies" :key="item.id">
        <post-item
          :show-referenced="false"
          :item="item"
          class="mb-4"
          @click="router.push('/posts/' + item.id)"
          @react="
            (symbol, attitude, delta) =>
              $emit('react', item.id, symbol, attitude, delta)
          "
        />
      </template>

      <!-- Empty State -->
      <div
        v-if="!replies || replies.length === 0"
        class="text-center py-8 text-muted-foreground"
      >
        <n-icon size="48" class="mb-2 opacity-50">
          <i class="mdi mdi-comment-outline"></i>
        </n-icon>
        <p>No replies yet</p>
      </div>
    </n-infinite-scroll>
  </div>
</template>

<script setup lang="ts">
import { useRepliesList } from "~/composables/useRepliesList"
import type { RepliesListParams } from "~/composables/useRepliesList"

const router = useRouter()

const props = defineProps<{
  params: RepliesListParams
  hideQuickReply?: boolean
}>()

defineEmits<{
  react: [postId: string, symbol: string, attitude: number, delta: number]
}>()

const { replies, hasError, error, loadMore, refresh } = useRepliesList(
  props.params
)
</script>

<style>
/* Removed Vuetify-specific styles */
</style>
