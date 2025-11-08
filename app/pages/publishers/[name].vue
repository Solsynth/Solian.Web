<template>
  <div v-if="user">
    <img
      :src="userBackground"
      class="object-cover w-full max-h-48 mb-8"
      style="aspect-ratio: 16/7"
    />

    <v-container>
      <div class="layout">
        <div class="main">
          <!-- Filter Section -->
          <v-card class="mb-4">
            <v-tabs
              v-model="activeCategoryTab"
              color="primary"
              class="mb-2"
              grow
            >
              <v-tab value="all">All</v-tab>
              <v-tab value="posts">Posts</v-tab>
              <v-tab value="articles">Articles</v-tab>
            </v-tabs>

            <v-row>
              <v-col cols="12" sm="6">
                <v-checkbox
                  :model-value="includeReplies"
                  label="Include replies"
                  :indeterminate="includeReplies === null"
                  density="compact"
                  prepend-icon="mdi-reply"
                  hide-details
                  class="px-4"
                  @update:model-value="cycleIncludeReplies"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-checkbox
                  v-model="mediaOnly"
                  label="Media only"
                  density="compact"
                  hide-details
                  class="px-4"
                  prepend-icon="mdi-attachment"
                />
              </v-col>
            </v-row>

            <v-checkbox
              v-model="orderDesc"
              label="Descending order"
              density="compact"
              prepend-icon="mdi-sort"
              class="px-4"
              hide-details
            />

            <v-divider class="my-1" />

            <v-list-item
              title="Advanced filters"
              prepend-icon="mdi-filter-variant"
              @click="showAdvancedFilters = !showAdvancedFilters"
            >
              <template #append>
                <v-icon>
                  {{
                    showAdvancedFilters ? "mdi-chevron-up" : "mdi-chevron-down"
                  }}
                </v-icon>
              </template>
            </v-list-item>

            <v-expand-transition>
              <div v-if="showAdvancedFilters" class="my-3 px-4">
                <v-text-field
                  v-model="queryTerm"
                  hide-details
                  label="Search"
                  placeholder="Search posts"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                />

                <v-select
                  v-model="order"
                  hide-details
                  label="Sort by"
                  :items="[
                    { title: 'Date', value: 'date' },
                    { title: 'Popularity', value: 'popularity' }
                  ]"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                />

                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      :model-value="periodStartFormatted"
                      hide-details
                      label="From date"
                      prepend-inner-icon="mdi-calendar"
                      variant="outlined"
                      density="comfortable"
                      readonly
                      @click="openDatePicker('start')"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      :model-value="periodEndFormatted"
                      hide-details
                      label="To date"
                      prepend-inner-icon="mdi-calendar"
                      variant="outlined"
                      density="comfortable"
                      readonly
                      @click="openDatePicker('end')"
                    />
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>
          </v-card>

          <post-list :key="filterKey" :params="postListParams" />

          <!-- Date Picker Dialog -->
          <v-dialog v-model="datePickerDialog" max-width="400">
            <v-card>
              <v-card-title>{{
                datePickerType === "start" ? "From date" : "To date"
              }}</v-card-title>
              <v-card-text>
                <v-date-picker
                  v-model="tempDate"
                  :max="new Date().toISOString().split('T')[0]"
                />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn @click="datePickerDialog = false">Cancel</v-btn>
                <v-btn color="primary" @click="confirmDatePicker">OK</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </div>
        <div class="sidebar flex flex-col gap-3">
          <v-card class="w-full">
            <v-card-text>
              <div class="flex items-center gap-4 mb-4">
                <v-avatar size="60" rounded="circle" :image="userPicture" />
                <div>
                  <div class="text-xl font-bold">
                    {{ user.nick || user.name }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    @{{ user.name }}
                  </div>
                </div>
              </div>
              <div v-if="htmlBio" class="bio-prose" v-html="htmlBio"></div>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </v-container>
  </div>
  <div v-else-if="notFound" class="flex justify-center items-center h-full">
    <v-empty-state
      icon="mdi-account-off"
      title="User not found"
      text="The user profile you're trying to access is not found."
    />
  </div>
  <div v-else class="flex justify-center items-center h-full">
    <v-progress-circular indeterminate size="64" color="primary" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useMarkdownProcessor } from "~/composables/useMarkdownProcessor"
import type { SnPublisher } from "~/types/api"
import type { PostListParams } from "~/composables/usePostList"

import PostList from "~/components/Post/PostList.vue"

const route = useRoute()

const notFound = ref<boolean>(false)
const user = ref<SnPublisher | null>(null)

const username = computed(() => {
  const nameStr = route.params.name?.toString()
  if (nameStr?.startsWith("@")) return nameStr.substring(1)
  return nameStr
})

// Use useFetch with the correct API URL to avoid router conflicts
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

// Filter state
const activeCategoryTab = ref("all")
const includeReplies = ref<boolean | null>(null)
const mediaOnly = ref(false)
const orderDesc = ref(true)
const showAdvancedFilters = ref(false)
const queryTerm = ref("")
const order = ref<string | undefined>(undefined)
const periodStart = ref<number | undefined>(undefined)
const periodEnd = ref<number | undefined>(undefined)

// Date picker dialog
const datePickerDialog = ref(false)
const datePickerType = ref<"start" | "end">("start")
const tempDate = ref<Date | undefined>(undefined)

const postListParams = computed<PostListParams>(() => {
  const params: PostListParams = {
    pubName: username.value,
    includeReplies: includeReplies.value ?? undefined,
    mediaOnly: mediaOnly.value,
    orderDesc: orderDesc.value,
    queryTerm: queryTerm.value || undefined,
    order: order.value,
    periodStart: periodStart.value,
    periodEnd: periodEnd.value
  }

  // Set type based on active tab
  if (activeCategoryTab.value === "posts") {
    params.type = 0 // Assuming 0 is for posts
  } else if (activeCategoryTab.value === "articles") {
    params.type = 1 // Assuming 1 is for articles
  }
  // 'all' means no type filter

  return params
})

const periodStartFormatted = computed(() => {
  return periodStart.value
    ? new Date(periodStart.value * 1000).toISOString().split("T")[0]
    : ""
})

const periodEndFormatted = computed(() => {
  return periodEnd.value
    ? new Date(periodEnd.value * 1000).toISOString().split("T")[0]
    : ""
})

// Create a key that changes when filters change to force PostList re-mount
const filterKey = computed(() => {
  return JSON.stringify(postListParams.value)
})

const cycleIncludeReplies = () => {
  if (includeReplies.value === null) {
    includeReplies.value = false
  } else if (includeReplies.value === false) {
    includeReplies.value = true
  } else {
    includeReplies.value = null
  }
}

const openDatePicker = (type: "start" | "end") => {
  datePickerType.value = type
  tempDate.value =
    type === "start"
      ? periodStart.value
        ? new Date(periodStart.value * 1000)
        : new Date()
      : periodEnd.value
      ? new Date(periodEnd.value * 1000)
      : new Date()
  datePickerDialog.value = true
}

const confirmDatePicker = () => {
  if (tempDate.value) {
    const timestamp = Math.floor(tempDate.value.getTime() / 1000)
    if (datePickerType.value === "start") {
      periodStart.value = timestamp
    } else {
      periodEnd.value = timestamp
    }
  }
  datePickerDialog.value = false
}

definePageMeta({
  alias: ["/p/:name()"]
})

useHead({
  title: computed(() => {
    if (notFound.value) {
      return "User not found"
    }
    if (user.value) {
      return user.value.nick || user.value.name
    }
    return "Loading user..."
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
  overflow-y: auto;
  height: auto;
  max-height: 100vh;
}

@media (min-width: 960px) {
  .layout {
    grid-template-columns: 2fr 1fr;
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
    top: calc(68px + 8px);
  }
}
</style>
