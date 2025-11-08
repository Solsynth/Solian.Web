import { ref, computed } from "vue"
import type { SnPost } from "~/types/api"

export interface RepliesListParams {
  postId: string
}

export interface RepliesListState {
  replies: SnPost[]
  loading: boolean
  error: string | null
  hasMore: boolean
  cursor: string | null
  total: number
}

export const useRepliesList = (params: RepliesListParams | Ref<RepliesListParams>) => {
  const api = useSolarNetwork()
  const pageSize = 20

  const state = ref<RepliesListState>({
    replies: [],
    loading: false,
    error: null,
    hasMore: true,
    cursor: null,
    total: 0
  })

  const isLoading = computed(() => state.value.loading)
  const hasError = computed(() => state.value.error !== null)
  const replies = computed(() => state.value.replies)
  const hasMore = computed(() => state.value.hasMore)

  // Get the current postId, handling both direct params and reactive params
  const currentPostId = computed(() => {
    const p = isRef(params) ? params.value : params
    return p.postId
  })

  const buildQueryParams = (cursor: string | null = null) => {
    const offset = cursor ? parseInt(cursor) : 0

    const queryParams: Record<string, string | number> = {
      offset,
      take: pageSize
    }

    return queryParams
  }

  const fetchReplies = async (cursor: string | null = null, append = false) => {
    // Don't fetch if postId is empty
    if (!currentPostId.value) {
      return { hasReachedEnd: false }
    }

    try {
      state.value.loading = true
      state.value.error = null

      const queryParams = buildQueryParams(cursor)

      let total: number = 0
      const response = await api<SnPost[]>(
        `/sphere/posts/${currentPostId.value}/replies`,
        {
          method: "GET",
          query: queryParams,
          onResponse({ response }) {
            total = parseInt(response.headers.get("x-total") || "0")
            if (response._data) {
              response._data = keysToCamel(response._data)
            }
          }
        }
      )

      const fetchedReplies = response

      if (append) {
        state.value.replies = [...state.value.replies, ...fetchedReplies]
      } else {
        state.value.replies = fetchedReplies
      }

      // Check if we've reached the end based on X-Total header
      const currentTotal = state.value.replies.length
      const hasReachedEnd = total > 0 && currentTotal >= total

      state.value.hasMore = !hasReachedEnd && fetchedReplies.length === pageSize
      state.value.cursor = state.value.hasMore
        ? ((cursor ? parseInt(cursor) : 0) + fetchedReplies.length).toString()
        : null

      return { hasReachedEnd }
    } catch (error) {
      state.value.error =
        error instanceof Error ? error.message : "Failed to fetch replies"
      console.error("Error fetching replies:", error)
      return { hasReachedEnd: false }
    } finally {
      state.value.loading = false
    }
  }

  const loadMore = async (options?: {
    side: string
    done: (status: "empty" | "loading" | "error" | "ok") => void
  }) => {
    if (!state.value.hasMore) {
      options?.done("empty")
      return
    }

    if (state.value.loading) {
      options?.done("loading")
      return
    }

    const result = await fetchReplies(state.value.cursor, true)

    if (result.hasReachedEnd) {
      options?.done("empty")
    }
  }

  const refresh = () => {
    fetchReplies(null, false)
  }

  // Watch for postId changes and fetch when it becomes valid
  watch(currentPostId, (newPostId, oldPostId) => {
    if (newPostId && newPostId !== oldPostId) {
      // Clear existing data when postId changes
      state.value.replies = []
      state.value.error = null
      state.value.cursor = null
      state.value.hasMore = true
      fetchReplies()
    }
  })

  // Initial load (only if postId is already valid)
  if (currentPostId.value) {
    fetchReplies()
  }

  return {
    replies,
    isLoading,
    hasError,
    hasMore,
    error: computed(() => state.value.error),
    loadMore,
    refresh
  }
}
