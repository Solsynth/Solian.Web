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
          <post-list :params="{ pubName: username }" />
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
                  <div class="text-body-2 text-medium-emphasis">@{{ user.name }}</div>
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
    htmlBio.value = value?.bio
      ? render(value.bio)
      : undefined
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
