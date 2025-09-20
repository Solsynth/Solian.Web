<template>
  <div v-if="user">
    <img
      :src="userBackground"
      class="object-cover w-full max-h-48 mb-8"
      style="aspect-ratio: 16/7"
    />

    <div class="container mx-auto px-8 pb-8">
      <div class="flex items-center gap-6 mb-8">
        <v-avatar size="80" rounded="circle" :image="userPicture" />
        <div>
          <div class="text-2xl font-bold">
            {{ user.nick || user.name }}
          </div>
          <div class="text-body-2 text-medium-emphasis">@{{ user.name }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-4">
          <v-card
            title="Info"
            prepend-icon="mdi-information"
            density="comfortable"
          >
            <v-card-text class="flex flex-col gap-2">
              <div class="flex gap-2" v-if="user?.profile?.time_zone">
                <span class="flex items-center gap-2 flex-grow">
                  <v-icon>mdi-clock-outline</v-icon>
                  Time Zone
                </span>
                <span class="flex gap-2">
                  <span>
                    {{
                      new Date().toLocaleTimeString(void 0, {
                        timeZone: user.profile.time_zone
                      })
                    }}
                  </span>
                  <span class="font-bold">·</span>
                  <span>{{ getOffsetUTCString(user.profile.time_zone) }}</span>
                  <span class="font-bold">·</span>
                  <span>{{ user.profile.time_zone }}</span>
                </span>
              </div>
              <div class="flex gap-2" v-if="user?.profile?.location">
                <span class="flex items-center gap-2 flex-grow">
                  <v-icon>mdi-map-marker-outline</v-icon>
                  Location
                </span>
                <span>
                  {{ user.profile.location }}
                </span>
              </div>
              <div
                class="flex gap-2"
                v-if="user?.profile?.first_name || user?.profile?.last_name"
              >
                <span class="flex items-center gap-2 flex-grow">
                  <v-icon>mdi-account-edit-outline</v-icon>
                  Name
                </span>
                <span>
                  {{
                    [
                      user.profile.first_name,
                      user.profile.middle_name,
                      user.profile.last_name
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }}
                </span>
              </div>
              <div
                class="flex gap-2"
                v-if="user?.profile?.gender || user?.profile?.pronouns"
              >
                <span class="flex items-center gap-2 flex-grow">
                  <v-icon>mdi-account-circle</v-icon>
                  Gender
                </span>
                <span class="flex gap-2">
                  <span>{{ user.profile.gender || "Unspecified" }}</span>
                  <span class="font-bold">·</span>
                  <span>{{ user.profile.pronouns || "Unspecified" }}</span>
                </span>
              </div>
              <div class="flex gap-2">
                <span class="flex items-center gap-2 flex-grow">
                  <v-icon>mdi-calendar-month-outline</v-icon>
                  Joined at
                </span>
                <span>{{
                  user ? new Date(user.created_at).toLocaleDateString() : ""
                }}</span>
              </div>
              <div class="flex gap-2" v-if="user?.profile?.birthday">
                <span class="flex items-center gap-2 flex-grow">
                  <v-icon>mdi-cake-variant-outline</v-icon>
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
            </v-card-text>
          </v-card>
          <v-card v-if="user?.perk_subscription">
            <v-card-text>
              <div class="flex justify-between items-center">
                <div class="flex flex-col">
                  <div class="text-xl font-bold">
                    {{
                      perkSubscriptionNames[user.perk_subscription.identifier]
                        ?.name || "Unknown"
                    }}
                    Tier
                  </div>
                  <div class="text-sm">Stellar Program Member</div>
                </div>
                <v-icon
                  size="48"
                  :color="
                    perkSubscriptionNames[user.perk_subscription.identifier]
                      ?.color || '#2196f3'
                  "
                >
                  mdi-star-circle
                </v-icon>
              </div>
            </v-card-text>
          </v-card>
          <v-card>
            <v-card-text>
              <div class="flex justify-between items-center mb-2">
                <div>Level {{ user?.profile?.level || 0 }}</div>
                <div>{{ user?.profile?.experience || 0 }} XP</div>
              </div>
              <v-progress-linear
                :model-value="user?.profile?.leveling_progress || 0"
                color="success"
                class="mb-0"
                rounded
              />
            </v-card-text>
          </v-card>
        </div>
        <div>
          <v-card v-if="htmlBio" title="Bio" prepend-icon="mdi-pencil">
            <v-card-text>
              <article
                class="bio-prose prose prose-sm dark:prose-invert prose-slate"
                v-html="htmlBio"
              ></article>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </div>
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
import { Marked } from "marked"

const route = useRoute()

const notFound = ref<boolean>(false)
const user = ref<any>(null)

const username = computed(() => {
  const nameStr = route.params.name?.toString()
  if (nameStr?.startsWith("@")) return nameStr.substring(1)
  return nameStr
})

// Use useFetch with the correct API URL to avoid router conflicts
const apiBase = useSolarNetworkUrl()
const apiBaseServer = useSolarNetworkUrl(true)

try {
  const { data, error } = await useFetch(
    `${apiBaseServer}/id/accounts/${username.value}`,
    { server: true }
  )

  if (error.value) {
    console.error("Failed to fetch user:", error.value)
    notFound.value = true
  } else {
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

const marked = new Marked()

const htmlBio = ref<string | undefined>(undefined)

watch(
  user,
  async (value) => {
    htmlBio.value = value?.profile.bio
      ? await marked.parse(value.profile.bio, { breaks: true })
      : undefined
  },
  { immediate: true, deep: true }
)

const userBackground = computed(() => {
  return user.value?.profile.background
    ? `${apiBase}/drive/files/${user.value.profile.background.id}?original=true`
    : undefined
})
const userPicture = computed(() => {
  return user.value?.profile.picture
    ? `${apiBase}/drive/files/${user.value.profile.picture.id}`
    : undefined
})

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
  alias: ["/@:name()"]
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
      const description = `View the profile of ${user.value.nick || user.value.name} on Solar Network.`
      return [
        { name: 'description', content: description },
      ]
    }
    return []
  })
})

defineOgImage({
  component: 'WithAvatar',
  title: computed(() => user.value ? user.value.nick || user.value.name : 'User Profile'),
  description: computed(() => user.value ? `View the profile of ${user.value.nick || user.value.name} on Solar Network.` : ''),
  avatarUrl: computed(() => userPicture.value),
  backgroundImage: computed(() => userBackground.value),
})
</script>

<style>
.bio-prose img {
  display: inline !important;
  margin: 0 !important;
}
</style>
