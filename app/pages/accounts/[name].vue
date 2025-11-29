<template>
  <div>
    <div class="fixed inset-0 blur-md" :style="pageStyle" />
    <img
      :src="userBackground"
      class="w-full max-h-48 object-cover object-top"
      :style="{ aspectRatio: '16/7', opacity: headerOpacity }"
    />

    <div v-if="user" class="relative min-h-layout">
      <div class="container mx-auto p-8 pt-12">
        <div class="flex items-center gap-6 mb-8">
          <n-avatar :size="80" round :src="userPicture" />
          <div>
            <div class="text-2xl font-bold">
              {{ user.nick || user.name }}
            </div>
            <div class="text-sm opacity-80">@{{ user.name }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-4">
            <n-card
              title="Info"
              size="small"
              :class="cardClass"
              :style="cardStyle"
              :content-style="cardContentStyle"
            >
              <template #header-extra>
                <n-icon :component="Info" />
              </template>
              <div class="flex flex-col gap-2">
                <div v-if="user?.profile?.timeZone" class="flex gap-2">
                  <span class="flex items-center gap-2 grow">
                    <n-icon :component="Clock" />
                    Time Zone
                  </span>
                  <span class="flex gap-2">
                    <span>
                      {{
                        new Date().toLocaleTimeString(void 0, {
                          timeZone: user.profile.timeZone
                        })
                      }}
                    </span>
                    <span class="font-bold">·</span>
                    <span>{{ getOffsetUTCString(user.profile.timeZone) }}</span>
                    <span class="font-bold">·</span>
                    <span>{{ user.profile.timeZone }}</span>
                  </span>
                </div>
                <div v-if="user?.profile?.location" class="flex gap-2">
                  <span class="flex items-center gap-2 grow">
                    <n-icon :component="MapPin" />
                    Location
                  </span>
                  <span>
                    {{ user.profile.location }}
                  </span>
                </div>
                <div
                  v-if="user?.profile?.firstName || user?.profile?.lastName"
                  class="flex gap-2"
                >
                  <span class="flex items-center gap-2 grow">
                    <n-icon :component="UserPen" />
                    Name
                  </span>
                  <span>
                    {{
                      [
                        user.profile.firstName,
                        user.profile.middleName,
                        user.profile.lastName
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }}
                  </span>
                </div>
                <div
                  v-if="user?.profile?.gender || user?.profile?.pronouns"
                  class="flex gap-2"
                >
                  <span class="flex items-center gap-2 grow">
                    <n-icon :component="User" />
                    Gender
                  </span>
                  <span class="flex gap-2">
                    <span>{{ user.profile.gender || "Unspecified" }}</span>
                    <span class="font-bold">·</span>
                    <span>{{ user.profile.pronouns || "Unspecified" }}</span>
                  </span>
                </div>
                <div class="flex gap-2">
                  <span class="flex items-center gap-2 grow">
                    <n-icon :component="Calendar" />
                    Joined at
                  </span>
                  <span>{{
                    user ? new Date(user.createdAt).toLocaleDateString() : ""
                  }}</span>
                </div>
                <div v-if="user?.profile?.birthday" class="flex gap-2">
                  <span class="flex items-center gap-2 grow">
                    <n-icon :component="Cake" />
                    Birthday
                  </span>
                  <span class="flex gap-2">
                    <span
                      >{{ calculateAge(new Date(user.profile.birthday)) }} yrs
                      old</span
                    >
                    <span class="font-bold">·</span>
                    <span>{{
                      new Date(user.profile.birthday).toLocaleDateString()
                    }}</span>
                  </span>
                </div>
              </div>
            </n-card>
            <n-card
              v-if="user?.perkSubscription"
              size="small"
              :class="cardClass"
              :style="cardStyle"
              :content-style="cardContentStyle"
            >
              <div class="flex justify-between items-center">
                <div class="flex flex-col">
                  <div class="text-xl font-bold">
                    {{
                      perkSubscriptionNames[user.perkSubscription.identifier]
                        ?.name || "Unknown"
                    }}
                    Tier
                  </div>
                  <div class="text-sm">Stellar Program Member</div>
                </div>
                <n-icon
                  :size="48"
                  :color="
                    perkSubscriptionNames[user.perkSubscription.identifier]
                      ?.color || '#2196f3'
                  "
                  :component="Star"
                />
              </div>
            </n-card>
            <n-card
              size="small"
              :class="cardClass"
              :style="cardStyle"
              :content-style="cardContentStyle"
            >
              <div class="flex justify-between items-center mb-2">
                <div>Level {{ user?.profile?.level || 0 }}</div>
                <div>{{ user?.profile?.experience || 0 }} XP</div>
              </div>
              <n-progress
                type="line"
                :percentage="user?.profile?.levelingProgress || 0"
                status="success"
                :show-indicator="false"
              />
            </n-card>
          </div>
          <div>
            <n-card
              v-if="htmlBio"
              title="Bio"
              size="small"
              :class="cardClass"
              :style="cardStyle"
              :content-style="cardContentStyle"
            >
              <template #header-extra>
                <n-icon :component="PenLine" />
              </template>
              <article
                class="bio-prose prose prose-sm dark:prose-invert prose-slate"
                v-html="htmlBio"
              ></article>
            </n-card>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else-if="notFound"
      class="relative flex justify-center items-center h-full"
    >
      <n-empty
        description="The user profile you're trying to access is not found."
      >
        <template #icon>
          <n-icon :component="UserX" />
        </template>
        <template #extra>
          <div class="text-lg font-bold">User not found</div>
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
import type { SnAccount } from "~/types/api"
import {
  Info,
  Clock,
  MapPin,
  UserPen,
  User,
  Calendar,
  Cake,
  Star,
  PenLine,
  UserX
} from "lucide-vue-next"

const route = useRoute()

const notFound = ref<boolean>(false)
const user = ref<SnAccount | null>(null)

const username = computed(() => {
  const nameStr = route.params.name?.toString()
  if (nameStr?.startsWith("@")) return nameStr.substring(1)
  return nameStr
})

// Use useFetch with the correct API URL to avoid router conflicts
const apiBase = useSolarNetworkUrl()
const apiBaseServer = useSolarNetworkUrl()

try {
  const { data, error } = await useFetch<SnAccount>(
    `${apiBaseServer}/id/accounts/${username.value}`,
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

interface PerkSubscriptionInfo {
  name: string
  tier: number
  color: string
}

const perkSubscriptionNames: Record<string, PerkSubscriptionInfo> = {
  "solian.stellar.primary": {
    name: "Stellar",
    tier: 1,
    color: "#2196f3"
  },
  "solian.stellar.nova": {
    name: "Nova",
    tier: 2,
    color: "#39c5bb"
  },
  "solian.stellar.supernova": {
    name: "Supernova",
    tier: 3,
    color: "#ffc109"
  }
}

const { render } = useMarkdownProcessor()

const htmlBio = ref<string | undefined>(undefined)

watch(
  user,
  (value) => {
    htmlBio.value = value?.profile.bio ? render(value.profile.bio) : undefined
  },
  { immediate: true, deep: true }
)

const userBackground = computed(() => {
  return user.value?.profile.background
    ? `${apiBase}/drive/files/${user.value.profile.background.id}?original=true`
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
const userPicture = computed(() => {
  return user.value?.profile.picture
    ? `${apiBase}/drive/files/${user.value.profile.picture.id}`
    : undefined
})

const cardClass = computed(() => ({
  "backdrop-blur-2xl": !!userBackground.value,
  "shadow-xl": !!userBackground.value
}))

const cardStyle = computed(() =>
  userBackground.value ? "background-color: rgba(255, 255, 255, 0.1)" : ""
)

const cardContentStyle = computed(() =>
  userBackground.value ? "background-color: transparent" : ""
)

function calculateAge(birthday: Date) {
  const birthDate = new Date(birthday)
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()

  // Check if the birthday hasn't occurred yet this year
  const monthDiff = today.getMonth() - birthDate.getMonth()
  const dayDiff = today.getDate() - birthDate.getDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--
  }

  return age
}

function getOffsetUTCString(targetTimeZone: string): string {
  const now = new Date()

  const localOffset = now.getTimezoneOffset() // in minutes
  const targetTime = new Date(
    now.toLocaleString("en-US", { timeZone: targetTimeZone })
  )
  const targetOffset = (now.getTime() - targetTime.getTime()) / 60000

  const diff = targetOffset - localOffset

  const sign = diff <= 0 ? "+" : "-" // inverted because positive offset is west of UTC
  const abs = Math.abs(diff)
  const hours = String(Math.floor(abs / 60)).padStart(2, "0")
  const minutes = String(Math.floor(abs % 60)).padStart(2, "0")

  return `${sign}${hours}:${minutes}`
}

definePageMeta({
  alias: ["/@:name()", "/u/:name()"]
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
  // @ts-ignore
  title: computed(() =>
    user.value ? user.value.nick || user.value.name : "User Profile"
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

<style>
.bio-prose img {
  display: inline !important;
  margin: 0 !important;
}
</style>
