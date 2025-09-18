<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8" :order="$vuetify.display.lgAndUp ? 1 : 2">
        <v-infinite-scroll style="height: calc(100vh - 57px)" :distance="10" @load="fetchActivites">
          <div v-for="activity in activites" :key="activity.id" class="mt-4">
            <post-item
              v-if="activity.type.startsWith('posts')"
              :item="activity.data"
              @click="router.push('/posts/' + activity.id)"
            />
          </div>
        </v-infinite-scroll>
      </v-col>
      <v-col cols="12" md="4" :order="$vuetify.display.lgAndUp ? 2 : 1">
        <v-card v-if="!userStore.user" class="w-full mt-4" title="About">
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
        <v-card class="mt-4 w-full">
          <v-card-text>
            <post-editor @posted="refreshActivities" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/user'
import { useSolarNetwork } from '~/composables/useSolarNetwork'

import PostEditor from '~/components/PostEditor.vue'
import PostItem from '~/components/PostItem.vue'

const router = useRouter()

const userStore = useUserStore()

const version = ref<any>(null)
async function fetchVersion() {
  const api = useSolarNetwork()
  const resp = await api('/sphere/version')
  version.value = resp
}
onMounted(() => fetchVersion())

const loading = ref(false)

const activites = ref<any[]>([])
const activitesLast = computed(() => activites.value[Math.max(activites.value.length - 1, 0)])
const activitesHasMore = ref(true)

async function fetchActivites() {
  if (loading.value) return
  if (!activitesHasMore.value) return
  loading.value = true
  const api = useSolarNetwork()
  const resp = await api(
    activitesLast.value == null
      ? '/sphere/activities'
      : `/sphere/activities?cursor=${new Date(activitesLast.value.created_at).toISOString()}`,
  )
  const data = resp
  activites.value = [...activites.value, ...data]
  activitesHasMore.value = data[0]?.type != 'empty'
  loading.value = false
}
onMounted(() => fetchActivites())

async function refreshActivities() {
  activites.value = []
  fetchActivites()
}
</script>
