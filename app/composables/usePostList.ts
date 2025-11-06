import { ref, computed } from "vue"
import type { SnPost } from "~/types/api"

export interface PostListParams {
  pubName?: string
  realm?: string
  type?: number
  categories?: string[]
  tags?: string[]
  pinned?: boolean
  shuffle?: boolean
  includeReplies?: boolean
  mediaOnly?: boolean
  queryTerm?: string
  order?: string
  periodStart?: number
  periodEnd?: number
  orderDesc?: boolean
}

export interface PostListState {
  posts: SnPost[]
  loading: boolean
  error: string | null
  hasMore: boolean
  cursor: string | null
  total: number
}

export const usePostList = (params: PostListParams = {}) => {
  const api = useSolarNetwork()
  const pageSize = 20

  const state = ref<PostListState>({
    posts: [],
    loading: false,
    error: null,
    hasMore: true,
    cursor: null,
    total: 0
  })

  const isLoading = computed(() => state.value.loading)
  const hasError = computed(() => state.value.error !== null)
  const posts = computed(() => state.value.posts)
  const hasMore = computed(() => state.value.hasMore)

  const buildQueryParams = (cursor: string | null = null) => {
    const offset = cursor ? parseInt(cursor) : 0

    const queryParams: Record<
      string,
      string | number | boolean | string[] | undefined
    > = {
      offset,
      take: pageSize,
      replies: params.includeReplies,
      orderDesc: params.orderDesc ?? true
    }

    if (params.shuffle) queryParams.shuffle = params.shuffle
    if (params.pubName) queryParams.pub = params.pubName
    if (params.realm) queryParams.realm = params.realm
    if (params.type !== undefined) queryParams.type = params.type
    if (params.tags) queryParams.tags = params.tags
    if (params.categories) queryParams.categories = params.categories
    if (params.pinned !== undefined) queryParams.pinned = params.pinned
    if (params.order) queryParams.order = params.order
    if (params.periodStart) queryParams.periodStart = params.periodStart
    if (params.periodEnd) queryParams.periodEnd = params.periodEnd
    if (params.queryTerm) queryParams.query = params.queryTerm
    if (params.mediaOnly !== undefined) queryParams.media = params.mediaOnly

    return queryParams
  }

  const fetchPosts = async (cursor: string | null = null, append = false) => {
    try {
      state.value.loading = true
      state.value.error = null

      const queryParams = buildQueryParams(cursor)

      let total: number = 0
      const response = await api<SnPost[]>("/sphere/posts", {
        method: "GET",
        query: queryParams,
        onResponse({ response }) {
          total = parseInt(response.headers.get("x-total") || "0")
          if (response._data) {
            response._data = keysToCamel(response._data)
          }
        }
      })

      const fetchedPosts = response

      if (append) {
        state.value.posts = [...state.value.posts, ...fetchedPosts]
      } else {
        state.value.posts = fetchedPosts
      }

      // Check if we've reached the end based on X-Total header
      const currentTotal = state.value.posts.length
      const hasReachedEnd = total > 0 && currentTotal >= total

      state.value.hasMore = !hasReachedEnd && fetchedPosts.length === pageSize
      state.value.cursor = state.value.hasMore
        ? ((cursor ? parseInt(cursor) : 0) + fetchedPosts.length).toString()
        : null

      return { hasReachedEnd }
    } catch (error) {
      state.value.error =
        error instanceof Error ? error.message : "Failed to fetch posts"
      console.error("Error fetching posts:", error)
      return { hasReachedEnd: false }
    } finally {
      state.value.loading = false
    }
  }

  const loadMore = async (options?: {
    side: string
    done: (status: "empty" | "loading" | "error") => void
  }) => {
    if (!state.value.hasMore || state.value.loading) {
      options?.done("empty")
      return
    }

    const result = await fetchPosts(state.value.cursor, true)

    if (result.hasReachedEnd) {
      options?.done("empty")
    }
  }

  const refresh = () => {
    fetchPosts(null, false)
  }

  // Initial load
  fetchPosts()

  return {
    posts,
    isLoading,
    hasError,
    hasMore,
    error: computed(() => state.value.error),
    loadMore,
    refresh
  }
}
