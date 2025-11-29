<template>
  <div>
    <div class="fixed inset-0 blur-md" :style="pageStyle" />
    <img
      :src="userBackground"
      class="w-full max-h-48 object-cover object-top"
      :style="{ aspectRatio: '16/7', opacity: headerOpacity }"
    />
    <div v-if="user" class="relative min-h-layout">
      <div class="container mx-auto p-4 sm:p-8">
        <div class="layout">
          <div class="sidebar flex flex-col gap-3">
            <n-card
              :class="cardClass"
              :style="cardStyle"
              :content-style="cardContentStyle"
            >
              <div class="flex items-center gap-4 mb-4">
                <n-avatar size="large" round :src="userPicture" />
                <div>
                  <div class="text-xl font-bold">
                    {{ user.nick || user.name }}
                  </div>
                  <div class="text-sm opacity-80">@{{ user.name }}</div>
                </div>
              </div>
              <article
                v-if="htmlBio"
                class="bio-prose prose prose-sm dark:prose-invert prose-slate"
                v-html="htmlBio"
              ></article>
            </n-card>

            <n-card
              v-if="user.verification"
              :class="cardClass"
              :style="cardStyle"
              :content-style="cardContentStyle"
            >
              <verification-status-card :mark="user.verification" />
            </n-card>
          </div>
          <div class="main">
            <!-- Filter Section -->
            <n-card
              class="mb-4"
              :class="cardClass"
              :style="cardStyle"
              :content-style="cardContentStyle"
            >
              <n-tabs v-model:value="activeCategoryTab" type="segment">
                <n-tab name="all">All</n-tab>
                <n-tab name="posts">Posts</n-tab>
                <n-tab name="articles">Articles</n-tab>
              </n-tabs>

              <div class="mx-4">
                <div
                  class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-4"
                >
                  <div
                    class="flex items-center gap-2 cursor-pointer"
                    @click="cycleIncludeReplies"
                  >
                    <n-icon :component="Reply" />
                    <n-checkbox
                      :checked="includeReplies !== false"
                      :indeterminate="includeReplies === null"
                      @update:checked="cycleIncludeReplies"
                    >
                      Include replies
                    </n-checkbox>
                  </div>
                  <div class="flex items-center gap-2">
                    <n-icon :component="Paperclip" />
                    <n-checkbox v-model:checked="mediaOnly">
                      Media only
                    </n-checkbox>
                  </div>
                  <div class="flex items-center gap-2">
                    <n-icon :component="ArrowUpDown" />
                    <n-checkbox v-model:checked="orderDesc">
                      Descending order
                    </n-checkbox>
                  </div>
                </div>

                <div
                  class="flex items-center cursor-pointer mt-4"
                  @click="showAdvancedFilters = !showAdvancedFilters"
                >
                  <n-icon :component="Filter" />
                  <span class="ml-2 font-medium">Advanced filters</span>
                  <n-icon class="ml-auto">
                    <ChevronDown v-if="!showAdvancedFilters" />
                    <ChevronUp v-else />
                  </n-icon>
                </div>

                <n-collapse-transition :show="showAdvancedFilters">
                  <div class="mt-4 flex flex-col gap-3">
                    <n-input
                      v-model:value="queryTerm"
                      placeholder="Search posts"
                    >
                      <template #prefix>
                        <n-icon :component="Search" />
                      </template>
                    </n-input>

                    <!-- the select only takes the common border radius somehow -->
                    <n-config-provider
                      :theme-overrides="{ common: { borderRadius: '8px' } }"
                    >
                      <n-select
                        v-model:value="order"
                        placeholder="Sort by"
                        :options="[
                          { label: 'Date', value: 'date' },
                          { label: 'Popularity', value: 'popularity' }
                        ]"
                      />
                    </n-config-provider>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <n-date-picker
                        v-model:value="periodStart"
                        type="date"
                        placeholder="From date"
                        clearable
                      />
                      <n-date-picker
                        v-model:value="periodEnd"
                        type="date"
                        placeholder="To date"
                        clearable
                      />
                    </div>
                  </div>
                </n-collapse-transition>
              </div>
            </n-card>

            <post-list :key="filterKey" :params="postListParams" />
          </div>
        </div>
      </div>
    </div>
    <div
      v-else-if="notFound"
      class="relative flex justify-center items-center h-full"
    >
      <n-empty
        description="The publisher profile you're trying to access is not found."
      >
        <template #icon>
          <n-icon :component="UserX" />
        </template>
      </n-empty>
    </div>
    <div v-else class="relative flex justify-center items-center h-full">
      <n-spin size="large" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useWindowScroll } from "@vueuse/core"
import { useMarkdownProcessor } from "~/composables/useMarkdownProcessor"
import type { SnPublisher } from "~/types/api"
import type { PostListParams } from "~/composables/usePostList"
import PostList from "~/components/Post/PostList.vue"
import {
  Reply,
  Paperclip,
  ArrowUpDown,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  UserX
} from "lucide-vue-next"

const route = useRoute()

const notFound = ref<boolean>(false)
const user = ref<SnPublisher | null>(null)

const username = computed(() => {
  const nameStr = route.params.name?.toString()
  if (nameStr?.startsWith("@")) return nameStr.substring(1)
  return nameStr
})

const apiBase = useSolarNetworkUrl()
const apiBaseServer = useSolarNetworkUrl()

try {
  const { data, error } = await useFetch<SnPublisher>(
    `${apiBaseServer}/sphere/publishers/${username.value}`,
    { server: true }
  )

  if (error.value) {
    console.error("Failed to fetch user:", error.value)
    notFound.value = true
  } else if (data.value) {
    user.value = data.value
  }
} catch (err) {
  console.error("Failed to fetch user:", err)
  notFound.value = true
}

const { render } = useMarkdownProcessor()

const htmlBio = ref<string | undefined>(undefined)

watch(
  user,
  (value) => {
    htmlBio.value = value?.bio ? render(value.bio) : undefined
  },
  { immediate: true, deep: true }
)

const userBackground = computed(() => {
  return user.value?.background
    ? `${apiBase}/drive/files/${user.value.background.id}?original=true`
    : undefined
})
const userPicture = computed(() => {
  return user.value?.picture
    ? `${apiBase}/drive/files/${user.value.picture.id}`
    : undefined
})

const { y: scrollY } = useWindowScroll()
const scrollThreshold = 192 // max-h-48 is 12rem = 192px

const backgroundOpacity = computed(() => {
  return Math.max(0, Math.min(scrollY.value / scrollThreshold, 1))
})

const headerOpacity = computed(() => {
  return 1 - backgroundOpacity.value
})

const pageStyle = computed(() => {
  if (!userBackground.value) return {}
  return {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${userBackground.value}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    opacity: backgroundOpacity.value
  }
})

const cardClass = computed(() => ({
  "backdrop-blur-2xl": !!userBackground.value,
  "shadow-xl": !!userBackground.value
}))

const cardStyle = computed(() =>
  userBackground.value
    ? "background-color: var(--n-color-modal)"
    : "background-color: var(--n-color)"
)

const cardContentStyle = computed(() =>
  userBackground.value ? "background-color: transparent" : ""
)

// Filter state
const activeCategoryTab = ref("all")
const includeReplies = ref<boolean | null>(null)
const mediaOnly = ref(false)
const orderDesc = ref(true)
const showAdvancedFilters = ref(false)
const queryTerm = ref("")
const order = ref<string | null>(null)
const periodStart = ref<number | null>(null)
const periodEnd = ref<number | null>(null)

const postListParams = computed<PostListParams>(() => {
  const params: PostListParams = {
    pubName: username.value,
    includeReplies: includeReplies.value ?? undefined,
    mediaOnly: mediaOnly.value,
    orderDesc: orderDesc.value,
    queryTerm: queryTerm.value || undefined,
    order: order.value ?? undefined,
    periodStart: periodStart.value
      ? Math.floor(periodStart.value / 1000)
      : undefined,
    periodEnd: periodEnd.value ? Math.floor(periodEnd.value / 1000) : undefined
  }

  if (activeCategoryTab.value === "posts") {
    params.type = 0
  } else if (activeCategoryTab.value === "articles") {
    params.type = 1
  }

  return params
})

const filterKey = computed(() => {
  return JSON.stringify(postListParams.value)
})

const cycleIncludeReplies = () => {
  if (includeReplies.value === null) {
    includeReplies.value = true
  } else if (includeReplies.value === true) {
    includeReplies.value = false
  } else {
    includeReplies.value = null
  }
}

definePageMeta({
  alias: ["/p/:name()"]
})

useHead({
  title: computed(() => {
    if (notFound.value) {
      return "Publisher not found"
    }
    if (user.value) {
      return user.value.nick || user.value.name
    }
    return "Loading publisher..."
  }),
  meta: computed(() => {
    if (user.value) {
      const description = `View the profile of ${
        user.value.nick || user.value.name
      } on Solar Network.`
      return [{ name: "description", content: description }]
    }
    return []
  })
})

defineOgImage({
  component: "ImageCard",
  // @ts-ignore
  title: computed(() =>
    user.value ? user.value.nick || user.value.name : "Publisher Profile"
  ),
  description: computed(() =>
    user.value
      ? `View the profile of ${
          user.value.nick || user.value.name
        } on Solar Network.`
      : ""
  ),
  avatarUrl: computed(() => userPicture.value),
  backgroundImage: computed(() => userBackground.value)
})
</script>

<style scoped>
.bio-prose img {
  display: inline !important;
  margin: 0 !important;
}

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.main {
  order: 2;
  min-width: 0;
}

.sidebar {
  order: 1;
  height: auto;
}

@media (min-width: 960px) {
  .layout {
    grid-template-columns: 1fr 2fr;
  }

  .main {
    order: unset;
  }

  .sidebar {
    order: unset;
  }
}

@media (min-width: 1280px) {
  .sidebar {
    position: sticky;
    top: calc(var(--header-height) + 8px);
    align-self: start;
  }
}
</style>
