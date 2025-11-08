<template>
  <v-container>
    <div class="layout">
      <div class="main">
        <div v-for="activity in activites" :key="activity.id" class="mb-4">
          <post-item
            v-if="activity.type.startsWith('posts')"
            :item="activity.data"
            @click="router.push('/posts/' + activity.id)"
          />
        </div>
      </div>
      <div class="sidebar flex flex-col gap-3">
        <v-card v-if="!userStore.isAuthenticated" class="w-full" title="About">
          <v-card-text>
            <p>Welcome to the <b>Solar Network</b></p>
            <p>The open social network. Friendly to everyone.</p>

            <p class="mt-4 opacity-75 text-xs">
              <span v-if="version == null">Loading...</span>
              <span v-else>
                v{{ version.version }} @
                {{ version.commit.substring(0, 6) }}
                {{ version.updatedAt }}
              </span>
            </p>
          </v-card-text>
        </v-card>
        <v-card v-else class="w-full">
          <v-card-text>
            <post-editor @posted="refreshActivities" />
          </v-card-text>
        </v-card>
        <sidebar-footer class="max-lg:hidden" />
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useInfiniteScroll } from "@vueuse/core"
import { useUserStore } from "~/stores/user"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import type { SnVersion, SnActivity } from "~/types/api"

import PostEditor from "~/components/Post/PostEditor.vue"
import PostItem from "~/components/Post/PostItem.vue"

const router = useRouter()

useHead({
  title: "Explore",
  meta: [
    {
      name: "description",
      content: "The open social network. Friendly to everyone."
    }
  ]
})

defineOgImage({
  title: "Explore",
  description: "The open social network. Friendly to everyone."
})

const userStore = useUserStore()

const version = ref<SnVersion | null>(null)
async function fetchVersion() {
  const api = useSolarNetwork()
  const resp = await api("/sphere/version")
  version.value = resp as SnVersion
}
onMounted(() => fetchVersion())

const loading = ref(false)

const activites = ref<SnActivity[]>([])
const activitesLast = computed(
  () => activites.value[Math.max(activites.value.length - 1, 0)]
)
const activitesHasMore = ref(true)

async function fetchActivites() {
  if (loading.value) return
  if (!activitesHasMore.value) return
  loading.value = true
  const api = useSolarNetwork()
  const resp = await api(
    activitesLast.value == null
      ? "/sphere/activities"
      : `/sphere/activities?cursor=${new Date(
          activitesLast.value.createdAt
        ).toISOString()}`
  )
  const data = resp as SnActivity[]
  activites.value = [...activites.value, ...data]
  activitesHasMore.value = data[0]?.type != "empty"
  loading.value = false
}
onMounted(() => fetchActivites())

useInfiniteScroll(window, fetchActivites, {
  canLoadMore: () => !loading.value && activitesHasMore.value,
  distance: 10
})

async function refreshActivities() {
  activites.value = []
  fetchActivites()
}
</script>

<style scoped>
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
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
