<template>
  <div class="py-6 px-5 min-h-screen">
    <!-- Loading State -->
    <div v-if="pending" class="text-center py-12 h-layout flex flex-col justify-center">
      <n-spin size="large" />
      <p class="mt-4 text-lg">Loading your rewind data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12 h-layout flex flex-col justify-center">
      <n-alert
        type="error"
        title="Error Loading Rewind"
        class="mb-4"
        :closable="false"
      >
        {{
          error instanceof Error ? error.message : "Failed to load rewind data"
        }}
      </n-alert>
      <n-button @click="fetchRewindData">Try Again</n-button>
    </div>

    <!-- Main Content -->
    <div v-else-if="rewindData" class="max-w-6xl mx-auto">
      <!-- Header Section -->
      <div class="text-center mb-8 h-layout flex flex-col justify-center">
        <img :src="CloudyRewind" class="w-36 h-36 mx-auto" />
        <h1 class="text-4xl font-bold mb-1">
          Solar Network Rewind
        </h1>
        <p class="text-lg opacity-80 mb-3">
          Reliving your {{ rewindData.year }} on the Solar Network
        </p>
        <p class="text-sm opacity-60">Cooming soon!</p>
      </div>

      <!-- Scroll-based Sections -->
      <div class="space-y-0">
        <!-- Section 1: Pass Data -->
        <div 
          ref="section1"
          class="scroll-section min-h-screen flex items-center justify-center"
          :class="{ 'animate-in': inView1 }"
        >
          <n-card class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon size="28" :component="ShieldIcon" class="text-blue-600" />
                <h2 class="text-2xl font-bold">Pass Achievements</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div class="text-4xl font-bold mb-2">
                  {{ rewindData.data.pass.maxCheckInStrike }}
                </div>
                <div class="text-sm opacity-80">
                  Longest Check-in Streak
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 2: Sphere Overview -->
        <div 
          ref="section2"
          class="scroll-section min-h-screen flex items-center justify-center"
          :class="{ 'animate-in': inView2 }"
        >
          <n-card class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon size="28" :component="GlobeIcon" class="text-green-600" />
                <h2 class="text-2xl font-bold">Sphere Activity</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div class="text-4xl font-bold mb-2">
                  {{ rewindData.data.sphere.totalCount }}
                </div>
                <div class="text-sm opacity-80">
                  Total Posts
                </div>
              </div>
              <div class="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div class="text-4xl font-bold mb-2">
                  {{ rewindData.data.sphere.upvoteCounts }}
                </div>
                <div class="text-sm opacity-80">
                  Upvotes Received
                </div>
              </div>
              <div class="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <div class="text-4xl font-bold mb-2">
                  {{ rewindData.data.sphere.mostProductiveDay.postCount }}
                </div>
                <div class="text-sm opacity-80">
                  Posts on Best Day
                </div>
                <div class="text-xs opacity-60 mt-1">
                  {{ formatDate(rewindData.data.sphere.mostProductiveDay.date) }}
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 3: Most Called Chat -->
        <div 
          ref="section3"
          class="scroll-section min-h-screen flex items-center justify-center"
          :class="{ 'animate-in': inView3 }"
        >
          <n-card class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon size="28" :component="MessageCircleIcon" class="text-indigo-600" />
                <h2 class="text-2xl font-bold">Favorite Chat Room</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <div class="flex items-center gap-4 mb-4">
                  <n-avatar
                    round
                    :size="48"
                    :src="getChatAvatar(rewindData.data.sphere.mostCalledChat)"
                  />
                  <div>
                  <h3 class="text-xl font-semibold">
                    {{ rewindData.data.sphere.mostCalledChat.name }}
                  </h3>
                  <p class="text-sm opacity-80">
                    Most visited chat room
                  </p>
                  </div>
                </div>
                <p class="text-slate-700 dark:text-slate-300">
                  {{ rewindData.data.sphere.mostCalledChat.description }}
                </p>
              </div>
              <div class="p-6 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                <div class="text-center">
                  <div class="text-3xl font-bold mb-2">
                    Most Popular Post
                  </div>
                  <div class="text-lg font-medium">
                    {{ rewindData.data.sphere.mostPopularPost.title }}
                  </div>
                  <div class="text-sm opacity-80 mt-2">
                    {{ rewindData.data.sphere.mostPopularPost.upvotes }} upvotes •
                    {{ rewindData.data.sphere.mostPopularPost.viewsTotal }} views
                  </div>
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 4: Most Called Accounts -->
        <div 
          ref="section4"
          class="scroll-section min-h-screen flex items-center justify-center"
          :class="{ 'animate-in': inView4 }"
        >
          <n-card class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon size="28" :component="UsersIcon" class="text-teal-600" />
                <h2 class="text-2xl font-bold">Top Connections</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="(account, index) in rewindData.data.sphere.mostCalledAccounts"
                :key="account.id"
                class="p-6 bg-teal-50 dark:bg-teal-900/20 rounded-xl"
              >
                <div class="flex items-center gap-4">
                  <n-avatar
                    round
                    :size="48"
                    :src="getAccountAvatar(account)"
                  />
                  <div>
                    <h3 class="text-lg font-semibold">{{ account.nick }}</h3>
                    <p class="text-sm opacity-80">
                      @{{ account.name }}
                    </p>
                    <p class="text-xs opacity-60 mt-1">
                      Rank #{{ index + 1 }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 5: Most Loved Publisher -->
        <div 
          ref="section5"
          class="scroll-section min-h-screen flex items-center justify-center"
          :class="{ 'animate-in': inView5 }"
        >
          <n-card class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon size="28" :component="HeartIcon" class="text-pink-600" />
                <h2 class="text-2xl font-bold">Most Loved Publisher</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                <div class="flex items-center gap-4 mb-4">
                  <n-avatar
                    round
                    :size="64"
                    :src="getPublisherAvatar(rewindData.data.sphere.mostLovedPublisher)"
                  />
                  <div>
                    <h3 class="text-2xl font-bold">
                      {{ rewindData.data.sphere.mostLovedPublisher.publisher.nick }}
                    </h3>
                    <p class="text-sm opacity-80">
                      @{{ rewindData.data.sphere.mostLovedPublisher.publisher.name }}
                    </p>
                    <div class="flex gap-2 mt-2">
                      <n-tag type="primary" size="small">
                        {{ rewindData.data.sphere.mostLovedPublisher.publisher.level }} Level
                      </n-tag>
                      <n-tag type="success" size="small">
                        {{ rewindData.data.sphere.mostLovedPublisher.upvoteCounts }} Upvotes
                      </n-tag>
                    </div>
                  </div>
                </div>
                <p class="text-slate-700 dark:text-slate-300">
                  {{ rewindData.data.sphere.mostLovedPublisher.publisher.bio }}
                </p>
              </div>
              <div class="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <div class="text-center">
                  <div class="text-3xl font-bold mb-2">
                    Most Messaged Chat
                  </div>
                  <div class="text-lg font-medium">
                    {{ rewindData.data.sphere.mostMessagedChat.name || 'Direct Message' }}
                  </div>
                  <p class="text-sm opacity-80 mt-2">
                    Your most active conversation
                  </p>
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 6: Summary -->
        <div 
          ref="section6"
          class="scroll-section min-h-screen flex items-center justify-center"
          :class="{ 'animate-in': inView6 }"
        >
          <n-card class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon size="28" :component="StarIcon" class="text-yellow-600" />
                <h2 class="text-2xl font-bold">
                  Your {{ rewindData.year }} Summary
                </h2>
              </div>
            </template>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div class="space-y-6">
                <div class="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h3 class="text-xl font-bold mb-4">Your Journey</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="opacity-80">Total Posts</span>
                      <span class="font-bold">{{ rewindData.data.sphere.totalCount }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="opacity-80">Upvotes Received</span>
                      <span class="font-bold">{{ rewindData.data.sphere.upvoteCounts }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="opacity-80">Longest Streak</span>
                      <span class="font-bold">{{ rewindData.data.pass.maxCheckInStrike }} days</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="opacity-80">Best Day</span>
                      <span class="font-bold">{{ rewindData.data.sphere.mostProductiveDay.postCount }} posts</span>
                    </div>
                  </div>
                </div>

                <div class="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                  <h3 class="text-xl font-bold mb-4">Your Highlights</h3>
                  <div class="space-y-2">
                    <p class="text-sm">
                      <span class="font-medium opacity-80">Favorite Chat:</span>
                      {{ rewindData.data.sphere.mostCalledChat.name }}
                    </p>
                    <p class="text-sm">
                      <span class="font-medium opacity-80">Top Connection:</span>
                      {{ rewindData.data.sphere.mostCalledAccounts[0]?.nick }}
                    </p>
                    <p class="text-sm">
                      <span class="font-medium opacity-80">Loved Publisher:</span>
                      {{ rewindData.data.sphere.mostLovedPublisher.publisher.nick }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-6">
                <div class="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <h3 class="text-xl font-bold mb-4">Share Your Year</h3>
                  <p class="opacity-80 mb-4">
                    Capture this moment and share your Solar Network journey with friends!
                  </p>

                  <div class="flex gap-3">
                    <n-button type="primary" size="large" @click="downloadSummary">
                      <template #icon>
                        <n-icon :component="DownloadIcon" />
                      </template>
                      Download Summary
                    </n-button>
                    <n-button size="large" @click="shareOnSocial">
                      <template #icon>
                        <n-icon :component="ShareIcon" />
                      </template>
                      Share
                    </n-button>
                  </div>
                </div>

                <div class="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <h3 class="text-xl font-bold mb-4">What's Next?</h3>
                  <p class="opacity-80">
                    Keep creating, connecting, and exploring. Your 2026 rewind will be even more amazing!
                  </p>
                </div>
              </div>
            </div>
          </n-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  GlobeIcon,
  MessageCircleIcon,
  UsersIcon,
  HeartIcon,
  StarIcon,
  ShieldIcon,
  DownloadIcon,
  ShareIcon
} from "lucide-vue-next"
import { ref, onMounted, onUnmounted } from "vue"
import { DateTime } from "luxon"
import type {
  SnRewind,
  SnRewindMostCalledChat,
  SnRewindMostCalledAccount,
  SnRewindMostLovedPublisher
} from "~/types/api"

import CloudyRewind from "~/assets/images/cloudy-lamb-rewind.png";

const api = useSolarNetwork()

const pending = ref(true)
const error = ref<unknown>(null)
const rewindData = ref<SnRewind | null>(null)

// Scroll animation refs
const section1 = ref<HTMLElement>()
const section2 = ref<HTMLElement>()
const section3 = ref<HTMLElement>()
const section4 = ref<HTMLElement>()
const section5 = ref<HTMLElement>()
const section6 = ref<HTMLElement>()

// Intersection Observer state
const inView1 = ref(false)
const inView2 = ref(false)
const inView3 = ref(false)
const inView4 = ref(false)
const inView5 = ref(false)
const inView6 = ref(false)

const observers: IntersectionObserver[] = []

// Fetch rewind data
const fetchRewindData = async () => {
  pending.value = true
  error.value = null
  try {
    const data = await api<SnRewind>("/pass/rewind/me")
    rewindData.value = data
  } catch (e) {
    error.value = e
  } finally {
    pending.value = false
  }
}

// Setup scroll animations
const setupScrollAnimations = () => {
  const options = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }

  const createObserver = (element: HTMLElement, inViewRef: { value: boolean }) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        inViewRef.value = entry.isIntersecting
      })
    }, options)
    
    if (element) {
      observer.observe(element)
      observers.push(observer)
    }
  }

  createObserver(section1.value!, inView1)
  createObserver(section2.value!, inView2)
  createObserver(section3.value!, inView3)
  createObserver(section4.value!, inView4)
  createObserver(section5.value!, inView5)
  createObserver(section6.value!, inView6)
}

onMounted(() => {
  fetchRewindData()
  // Delay setup to ensure DOM is ready
  setTimeout(setupScrollAnimations, 100)
})

onUnmounted(() => {
  observers.forEach(observer => observer.disconnect())
})

// Helper methods
const formatDate = (dateString: string): string => {
  return DateTime.fromISO(dateString).toFormat("MMM dd, yyyy")
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getChatAvatar = (chat: SnRewindMostCalledChat) => {
  // Return default avatar for chat rooms
  return "/api/placeholder/48/48"
}

const getAccountAvatar = (account: SnRewindMostCalledAccount) => {
  const apiBase = useSolarNetworkUrl()
  return account.profile?.picture
    ? `${apiBase}/drive/files/${account.profile.picture.id}`
    : "/api/placeholder/48/48"
}

const getPublisherAvatar = (publisher: SnRewindMostLovedPublisher) => {
  const apiBase = useSolarNetworkUrl()
  return publisher.publisher?.picture
    ? `${apiBase}/drive/files/${publisher.publisher.picture.id}`
    : "/api/placeholder/64/64"
}

// Download functionality
const downloadSummary = () => {
  // Create a simple text summary for download
  const summary = `
Solar Network Rewind ${rewindData.value?.year}

Your Journey:
- Total Posts: ${rewindData.value?.data.sphere.totalCount}
- Upvotes Received: ${rewindData.value?.data.sphere.upvoteCounts}
- Longest Check-in Streak: ${rewindData.value?.data.pass.maxCheckInStrike} days
- Best Day: ${
    rewindData.value?.data.sphere.mostProductiveDay.postCount
  } posts on ${formatDate(rewindData.value?.data.sphere.mostProductiveDay.date ?? 'none')}

Highlights:
- Favorite Chat: ${rewindData.value?.data.sphere.mostCalledChat.name}
- Top Connection: ${rewindData.value?.data.sphere.mostCalledAccounts[0]?.nick}
- Loved Publisher: ${
    rewindData.value?.data.sphere.mostLovedPublisher.publisher.nick
  }

Generated on: ${new Date().toLocaleDateString()}
  `

  const blob = new Blob([summary], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `solar-network-rewind-${rewindData.value?.year}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const shareOnSocial = () => {
  const text = `Just checked out my Solar Network Rewind ${rewindData.value?.year}! 🚀\n\nI made ${rewindData.value?.data.sphere.totalCount} posts and got ${rewindData.value?.data.sphere.upvoteCounts} upvotes. What was your highlight of the year?`

  if (navigator.share) {
    navigator.share({
      title: "My Solar Network Rewind",
      text: text,
      url: window.location.href
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(text)
    window.alert("Text copied to clipboard!")
  }
}

useHead({
  title: "Your Solar Network Rewind",
  meta: [
    {
      name: "description",
      content: "Relive your Solar Network journey from the past year"
    }
  ]
})
</script>

<style scoped>
.scroll-section {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.scroll-section.animate-in {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered animation delays */
.scroll-section:nth-child(1).animate-in { transition-delay: 0.1s; }
.scroll-section:nth-child(2).animate-in { transition-delay: 0.2s; }
.scroll-section:nth-child(3).animate-in { transition-delay: 0.3s; }
.scroll-section:nth-child(4).animate-in { transition-delay: 0.4s; }
.scroll-section:nth-child(5).animate-in { transition-delay: 0.5s; }
.scroll-section:nth-child(6).animate-in { transition-delay: 0.6s; }
</style>
