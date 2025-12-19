<template>
  <div>
    <!-- Invite Variant: Centered Card -->
    <div v-if="isInviteMode">
      <div
        class="fixed inset-0 transition-all duration-500"
        :style="pageStyle"
      />

      <div
        class="relative flex items-center justify-center min-h-layout overflow-auto p-4"
      >
        <n-card
          :class="[
            'w-full',
            'max-w-[480px]',
            { 'backdrop-blur-2xl': realmBackground },
            { 'shadow-xl': realmBackground }
          ]"
          size="large"
          :style="
            realmBackground ? 'background-color: rgba(255, 255, 255, 0.1)' : ''
          "
          :content-style="
            realmBackground ? 'background-color: transparent' : ''
          "
        >
          <div v-if="realm" class="p-4">
            <div class="flex flex-col items-center text-center">
              <n-avatar :src="realmPicture" :size="80" class="mb-4">
                <n-icon v-if="!realmPicture" :component="Users" :size="40" />
              </n-avatar>

              <div class="flex gap-2 items-center">
                <h2 class="text-2xl font-bold mb-2">{{ realm.name }}</h2>
                <verification-mark
                  v-if="realm.verification"
                  :mark="realm.verification"
                  :size="20"
                />
              </div>
              <p v-if="realm.description" class="text-base mb-4 opacity-80">
                {{ realm.description }}
              </p>

              <div class="flex gap-2 mb-6">
                <n-tag :bordered="false" type="info">
                  {{ realm.isCommunity ? "Community" : "Organization" }}
                </n-tag>
                <n-tag
                  :bordered="false"
                  :type="realm.isPublic ? 'success' : 'warning'"
                >
                  {{ realm.isPublic ? "Public" : "Private" }}
                </n-tag>
              </div>

              <n-card
                v-if="realm.verification"
                class="text-left mb-4 w-full"
                :style="
                  realmBackground
                    ? 'background-color: rgba(255, 255, 255, 0.1)'
                    : ''
                "
                :content-style="
                  realmBackground ? 'background-color: transparent' : ''
                "
              >
                <verification-status-card :mark="realm.verification" />
              </n-card>

              <n-button
                text-color="white"
                type="primary"
                block
                size="large"
                :loading="isJoining"
                :disabled="isMember"
                @click="handleJoin"
              >
                <template #icon>
                  <n-icon :component="UserPlus" />
                </template>
                Join Realm
              </n-button>

              <n-alert
                v-if="isMember"
                type="info"
                title="Already Joined"
                class="mt-4"
              >
                You already joined this realm,
                <nuxt-link
                  :to="`/realms/${route.params.slug}`"
                  class="underline font-bold"
                >
                  go to the realm page instead.
                </nuxt-link>
              </n-alert>
            </div>
          </div>
          <div v-else-if="notFound" class="flex justify-center p-8">
            <n-empty description="Realm not found">
              <template #icon>
                <n-icon :component="Users" />
              </template>
            </n-empty>
          </div>
          <div v-else class="flex justify-center p-8">
            <n-spin size="large" />
          </div>
        </n-card>
      </div>
    </div>

    <!-- Regular View: Full Realm Page -->
    <div v-else>
      <div class="fixed inset-0 blur-md" :style="pageStyle" />
      <img
        :src="realmBackground"
        class="w-full max-h-48 object-cover object-top"
        :style="{ aspectRatio: '16/7', opacity: headerOpacity }"
      />
      <div v-if="realm" class="relative min-h-layout">
        <div class="container mx-auto p-4 sm:p-8">
          <div class="layout">
            <div class="sidebar flex flex-col gap-3">
              <n-card
                :class="cardClass"
                :style="cardStyle"
                :content-style="cardContentStyle"
              >
                <div class="flex items-center gap-4 mb-4">
                  <n-avatar size="large" round :src="realmPicture">
                    <n-icon
                      v-if="!realmPicture"
                      :component="Users"
                      :size="28"
                    />
                  </n-avatar>
                  <div>
                    <div class="flex gap-2 items-center">
                      <div class="text-xl font-bold">
                        {{ realm.name }}
                      </div>
                      <verification-mark
                        v-if="realm.verification"
                        :mark="realm.verification"
                      />
                    </div>

                    <div class="text-sm opacity-80">@{{ realm.slug }}</div>
                  </div>
                </div>
                <p v-if="realm.description" class="text-sm mb-4">
                  {{ realm.description }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <n-tag :bordered="false" type="info">
                    {{ realm.isCommunity ? "Community" : "Organization" }}
                  </n-tag>
                  <n-tag
                    :bordered="false"
                    :type="realm.isPublic ? 'success' : 'warning'"
                  >
                    {{ realm.isPublic ? "Public" : "Private" }}
                  </n-tag>
                </div>
              </n-card>

              <n-card
                v-if="realm.verification"
                :class="cardClass"
                :style="cardStyle"
                :content-style="cardContentStyle"
              >
                <verification-status-card :mark="realm.verification" />
              </n-card>

              <div v-if="realm.isPublic && !isMember">
                <n-button
                  type="primary"
                  block
                  size="large"
                  :loading="isJoining"
                  @click="handleJoin"
                >
                  <template #icon>
                    <n-icon :component="UserPlus" />
                  </template>
                  Join Realm
                </n-button>
              </div>
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
        <n-empty description="The realm you're trying to access is not found.">
          <template #icon>
            <n-icon :component="Users" />
          </template>
        </n-empty>
      </div>
      <div v-else class="relative flex justify-center items-center h-full">
        <n-spin size="large" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useWindowScroll } from "@vueuse/core"
import { useMarkdownProcessor } from "~/composables/useMarkdownProcessor"
import type { SnRealm } from "~/types/api"
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
  Users,
  UserPlus
} from "lucide-vue-next"

const route = useRoute()
const message = useMessage()
const api = useSolarNetwork()

const notFound = ref<boolean>(false)
const realm = ref<SnRealm | null>(null)
const isJoining = ref(false)
const isMember = ref(false)
const checkingMembership = ref(false)

// Check if we're in invite mode
const isInviteMode = computed(() => {
  return !!route.query.invite
})

// Use useFetch with the correct API URL to avoid router conflicts
const apiBase = useSolarNetworkUrl()
const apiBaseServer = useSolarNetworkUrl()

try {
  const { data, error } = await useFetch<SnRealm>(
    `${apiBaseServer}/pass/realms/${route.params.slug}`,
    { server: true }
  )

  if (error.value) {
    console.error("Failed to fetch realm:", error.value)
    notFound.value = true
  } else if (data.value) {
    realm.value = keysToCamel(data.value)
  }
} catch (err) {
  console.error("Failed to fetch realm:", err)
  notFound.value = true
}

const realmBackground = computed(() => {
  return realm.value?.background
    ? `${apiBase}/drive/files/${realm.value.background.id}?original=true`
    : undefined
})
const realmPicture = computed(() => {
  return realm.value?.picture
    ? `${apiBase}/drive/files/${realm.value.picture.id}`
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
  if (!realmBackground.value) return {}
  return {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${realmBackground.value}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    opacity: isInviteMode.value ? 1 : backgroundOpacity.value
  }
})

const cardClass = computed(() => ({
  "backdrop-blur-2xl": !!realmBackground.value,
  "shadow-xl": !!realmBackground.value
}))

const cardStyle = computed(() =>
  realmBackground.value
    ? "background-color: var(--n-color-modal)"
    : "background-color: var(--n-color)"
)

const cardContentStyle = computed(() =>
  realmBackground.value ? "background-color: transparent" : ""
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
    realm: route.params.slug as string,
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

// Check membership status
async function checkMembership() {
  if (!realm.value) return

  checkingMembership.value = true
  try {
    await api(`/pass/realms/${realm.value.slug}/members/me`, {
      method: "GET"
    })
    isMember.value = true
  } catch (err) {
    // 404 means not a member
    isMember.value = false
  } finally {
    checkingMembership.value = false
  }
}

// Handle join realm
async function handleJoin() {
  if (!realm.value) return

  isJoining.value = true
  try {
    await api(`/pass/realms/${realm.value.slug}/members/me`, {
      method: "POST"
    })
    message.success(`Successfully joined ${realm.value.name}!`)
    isMember.value = true
    // Redirect to the realm page without invite query if in invite mode
    if (isInviteMode.value) {
      await navigateTo(`/realms/${realm.value.slug}`)
    }
  } catch (err) {
    message.error(err instanceof Error ? err.message : String(err))
  } finally {
    isJoining.value = false
  }
}

// Check membership on mount
onMounted(() => {
  if (realm.value) {
    checkMembership()
  }
})

definePageMeta({
  title: "Realms",
  alias: ["/r/:slug()"]
})

useHead({
  title: computed(() => {
    if (notFound.value) {
      return "Realm not found"
    }
    if (realm.value) {
      return realm.value.name
    }
    return "Loading realm..."
  }),
  meta: computed(() => {
    if (realm.value) {
      const description =
        realm.value.description || `Join ${realm.value.name} on Solar Network.`
      return [{ name: "description", content: description }]
    }
    return []
  })
})

defineOgImage({
  component: "ImageCard",
  // @ts-ignore
  title: computed(() => (realm.value ? realm.value.name : "Realm")),
  description: computed(() =>
    realm.value
      ? realm.value.description || `Join ${realm.value.name} on Solar Network.`
      : ""
  ),
  avatarUrl: computed(() => realmPicture.value),
  backgroundImage: computed(() => realmBackground.value)
})
</script>

<style scoped>
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
