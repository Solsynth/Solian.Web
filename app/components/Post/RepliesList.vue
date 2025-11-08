<template>
  <div class="replies-list">
    <post-quick-reply v-if="!props.hideQuickReply" class="mb-4" />

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
    <v-infinite-scroll
      class="flex flex-col gap-4 mt-0"
      height="auto"
      side="end"
      manual
      @load="loadMore"
    >
      <template v-for="item in replies" :key="item.id">
        <post-item
          :show-referenced="false"
          :item="item"
          @click="router.push('/posts/' + item.id)"
          @react="
            (symbol, attitude, delta) =>
              $emit('react', item.id, symbol, attitude, delta)
          "
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
        <div v-if="!replies" class="text-center py-8 text-muted-foreground">
          <v-icon
            icon="mdi-comment-outline"
            size="48"
            class="mb-2 opacity-50"
          />
          <p>No replies yet</p>
        </div>
      </template>
    </v-infinite-scroll>
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
.replies-list .v-infinite-scroll .v-infinite-scroll__side:first-child {
  display: none;
}
</style>
