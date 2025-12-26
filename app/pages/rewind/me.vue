<template>
  <div class="py-6 px-5 min-h-screen">
    <!-- Loading State -->
    <div
      v-if="pending"
      class="text-center py-12 h-layout flex flex-col justify-center"
    >
      <n-spin size="large" />
      <p class="mt-4 text-lg">正在整理你的回顾数据……</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="text-center py-12 h-layout flex flex-col justify-center max-w-2xl mx-auto"
    >
      <n-alert
        type="error"
        title="Error Loading Rewind"
        class="mb-4"
        :closable="false"
      >
        {{
          error instanceof Error
            ? error.message
            : "看起来出了点问题，请稍后再试。"
        }}
      </n-alert>
      <n-button @click="fetchRewindData">重试</n-button>
    </div>

    <!-- Main Content -->
    <div v-else-if="rewindData" class="max-w-6xl mx-auto">
      <!-- Header Section -->
      <div class="text-center mb-8 h-layout flex flex-col justify-center">
        <img :src="CloudyRewind" class="w-36 h-36 mx-auto" />
        <h1 class="text-4xl font-bold mb-1">Solar Network 年度回顾</h1>
        <n-tooltip placement="bottom">
          <template #trigger>
            <div class="text-lg opacity-80">
              回顾你的 {{ rewindData.year }} 年在 Solar Network 的精彩旅程
            </div>
          </template>
          数据范围 2024/12/26 - 2025/12/25
        </n-tooltip>
      </div>

      <!-- Scroll-based Sections -->
      <div class="space-y-0">
        <!-- Section 1: Pass Data -->
        <div
          ref="section1"
          class="scroll-section min-h-screen flex items-center justify-center"
          :class="{ 'animate-in': inView1 }"
        >
          <n-card class="w-full max-w-4xl">
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon
                  size="28"
                  :component="CalendarDaysIcon"
                  class="text-blue-600"
                />
                <h2 class="text-2xl font-bold">活动数据</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-6">
                <n-statistic label="最长连续签到" tabular-nums>
                  <n-number-animation
                    :to="rewindData.data.pass.maxCheckInStreak"
                  />
                  <template #suffix>天</template>
                </n-statistic>

                <n-statistic label="签到完成度" tabular-nums>
                  <n-number-animation
                    :to="rewindData.data.pass.checkInCompleteness * 100"
                    :precision="2"
                  />
                  <template #suffix>%</template>
                </n-statistic>

                <n-statistic label="最晚活动时间">
                  {{ rewindData.data.pass.latestActiveTime }}
                </n-statistic>

                <div class="flex flex-row gap-8 flex-wrap">
                  <n-statistic label="最活跃的日期">
                    {{ rewindData.data.pass.mostActiveDay }}
                  </n-statistic>
                  <n-statistic label="最活跃的日子">
                    {{ rewindData.data.pass.mostActiveWeekday }}
                  </n-statistic>
                </div>
              </div>

              <div class="md:text-right pr-4 max-md:order-first">
                <div class="text-5xl mb-3">🔥</div>
                <div class="text-2xl font-bold mb-1">
                  {{ getStreakMessage(rewindData.data.pass.maxCheckInStreak) }}
                </div>
                <div class="text-lg opacity-80">
                  {{
                    getStreakDescription(rewindData.data.pass.maxCheckInStreak)
                  }}
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 2: Creator Career Overview -->
        <div
          ref="section2"
          class="scroll-section min-h-screen flex items-center justify-center"
          :class="{ 'animate-in': inView2 }"
        >
          <n-card
            class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon
                  size="28"
                  :component="PencilLineIcon"
                  class="text-green-600"
                />
                <h2 class="text-2xl font-bold">创作生涯</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <n-statistic label="总发帖数量" tabular-nums>
                <n-number-animation
                  :to="rewindData.data.sphere.totalPostCount"
                />
                <template #suffix>篇</template>
              </n-statistic>
              <n-statistic label="总获顶数量" tabular-nums>
                <n-number-animation
                  :to="rewindData.data.sphere.totalUpvoteCount"
                />
                <template #suffix>个</template>
              </n-statistic>
              <n-statistic label="高产记录" tabular-nums>
                <n-number-animation
                  :to="rewindData.data.sphere.mostProductiveDay.postCount"
                />
                <template #suffix>
                  篇帖子于
                  {{
                    rewindData.data.sphere.mostProductiveDay.date
                      .split(" ")[0]
                      ?.split("/")
                      .slice(0, 2)
                      .join("/")
                  }}
                </template>
              </n-statistic>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="font-bold mb-2 flex items-center gap-2">
                  <n-icon :component="PartyPopperIcon" size="16" />
                  最受欢迎的帖子
                </h3>
                <nuxt-link
                  :to="`/posts/${rewindData.data.sphere.mostPopularPost.id}`"
                  target="_blank"
                >
                  <post-item-contained
                    :post-id="rewindData.data.sphere.mostPopularPost.id"
                  />
                </nuxt-link>
              </div>
              <div>
                <h3 class="font-bold mb-2 flex items-center gap-2">
                  <n-icon :component="HeartIcon" size="16" />
                  最喜欢你的观众
                </h3>
                <account-nameplate
                  :data="rewindData.data.sphere.mostLovedAudience.account"
                >
                  <template #suffix>
                    <n-config-provider
                      :theme-overrides="{
                        Statistic: {
                          valueFontSize: '1.3rem',
                          labelFontSize: '0.8rem'
                        }
                      }"
                    >
                      <n-statistic label="贡献的顶数量" tabular-nums>
                        <n-number-animation
                          :to="
                            rewindData.data.sphere.mostLovedAudience
                              .upvoteCounts
                          "
                        />
                        <template #suffix>个</template>
                      </n-statistic>
                    </n-config-provider>
                  </template>
                </account-nameplate>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 3: Explore History -->
        <div
          ref="section3"
          class="scroll-section min-h-screen flex items-center justify-center"
          :class="{ 'animate-in': inView3 }"
        >
          <n-card
            class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon
                  size="28"
                  :component="GlobeIcon"
                  class="text-indigo-600"
                />
                <h2 class="text-2xl font-bold">探索历史</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="font-bold mb-2 flex items-center gap-2">
                  <n-icon :component="HeartIcon" size="16" />
                  你最喜欢的创作者
                </h3>
                <nuxt-link
                  :to="`/publishers/${rewindData.data.sphere.mostLovedPublisher.publisher.id}`"
                  target="_blank"
                >
                  <publisher-nameplate
                    :data="rewindData.data.sphere.mostLovedPublisher.publisher"
                  >
                    <template #suffix>
                      <n-config-provider
                        :theme-overrides="{
                          Statistic: {
                            valueFontSize: '1.3rem',
                            labelFontSize: '0.8rem'
                          }
                        }"
                      >
                        <n-statistic label="给予的顶数" tabular-nums>
                          <n-number-animation
                            :to="
                              rewindData.data.sphere.mostLovedPublisher
                                .upvoteCounts
                            "
                          />
                          <template #suffix>个</template>
                        </n-statistic>
                      </n-config-provider>
                    </template>
                  </publisher-nameplate>
                </nuxt-link>
              </div>
              <div class="text-right flex flex-col justify-center px-5 gap-2">
                <div class="text-4xl">🤔</div>
                <p class="text-lg">
                  看起来你真的喜欢他/她呢 (´▽｀) <br />
                  新的一年不妨试试探索更多优秀创作者吧！
                </p>
                <p class="text-xs opacity-80">
                  <del>绝对不是因为没有别的东西放在这里所以写一些废话</del>
                </p>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 4: Chat Summary -->
        <div
          ref="section4"
          class="scroll-section min-h-screen flex items-center justify-center"
          :class="{ 'animate-in': inView4 }"
        >
          <n-card
            class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon
                  size="28"
                  :component="MessageCircleIcon"
                  class="text-teal-600"
                />
                <h2 class="text-2xl font-bold">社交经历</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-6 mt-2">
                <div>
                  <h3 class="font-bold mb-2 flex items-center gap-2">
                    <n-icon :component="HeartIcon" size="16" />
                    最常出没的聊天室
                  </h3>
                  <n-card size="small">
                    <div class="flex items-center gap-4">
                      <n-avatar
                        :src="
                          getChatRoomAvatar(
                            rewindData.data.sphere.mostCalledChat.chat
                          )
                        "
                        >{{
                          rewindData.data.sphere.mostMessagedChat.chat.name?.substring(
                            0,
                            1
                          )
                        }}</n-avatar
                      >
                      <div class="grow flex flex-col">
                        <div class="text-md font-bold">
                          {{
                            rewindData.data.sphere.mostMessagedChat.chat.name
                          }}
                        </div>
                        <p>
                          <n-number-animation
                            :to="
                              rewindData.data.sphere.mostMessagedChat
                                .messageCounts
                            "
                          />
                          条消息
                        </p>
                      </div>
                    </div>
                  </n-card>
                </div>
                <div>
                  <h3 class="font-bold mb-2 flex items-center gap-2">
                    <n-icon :component="MessageCircleHeartIcon" size="16" />
                    最常联系的人
                  </h3>
                  <n-card size="small">
                    <div class="flex items-center gap-4">
                      <n-avatar
                        object-fit="cover"
                        :src="getChatMemberAvatar(rewindData.data.sphere.mostMessagedDirectChat.chat.members[0]!)"
                      />
                      <div class="grow flex flex-col">
                        <div class="text-md font-bold">
                          {{
                            rewindData.data.sphere.mostMessagedDirectChat.chat
                              .members[0]!.account.name || "Direct Message"
                          }}
                        </div>
                        <p>
                          <n-number-animation
                            :to="
                              rewindData.data.sphere.mostMessagedDirectChat
                                .messageCounts
                            "
                          />
                          条消息
                        </p>
                      </div>
                    </div>
                  </n-card>
                </div>
              </div>
              <div class="text-right flex flex-col justify-center px-5 gap-2">
                <div class="text-4xl">💬</div>
                <p class="text-lg">
                  一眼丁真，鉴定为 <br/>
                  <b>纯纯的话唠</b>
                </p>
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
          <n-card
            class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon
                  size="28"
                  :component="StarIcon"
                  class="text-yellow-600"
                />
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
                      <span class="font-bold">{{
                        rewindData.data.sphere.totalPostCount
                      }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="opacity-80">Upvotes Received</span>
                      <span class="font-bold">{{
                        rewindData.data.sphere.totalUpvoteCount
                      }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="opacity-80">Longest Streak</span>
                      <span class="font-bold"
                        >{{ rewindData.data.pass.maxCheckInStreak }} days</span
                      >
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="opacity-80">Best Day</span>
                      <span class="font-bold"
                        >{{
                          rewindData.data.sphere.mostProductiveDay.postCount
                        }}
                        posts</span
                      >
                    </div>
                  </div>
                </div>

                <div class="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                  <h3 class="text-xl font-bold mb-4">Your Highlights</h3>
                  <div class="space-y-2">
                    <p class="text-sm">
                      <span class="font-medium opacity-80">Favorite Chat:</span>
                    </p>
                    <p class="text-sm">
                      <span class="font-medium opacity-80"
                        >Top Connection:</span
                      >
                      {{ rewindData.data.sphere.mostCalledAccounts[0]?.nick }}
                    </p>
                    <p class="text-sm">
                      <span class="font-medium opacity-80"
                        >Loved Publisher:</span
                      >
                      {{
                        rewindData.data.sphere.mostLovedPublisher.publisher.nick
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-6">
                <div class="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <h3 class="text-xl font-bold mb-4">Share Your Year</h3>
                  <p class="opacity-80 mb-4">
                    Capture this moment and share your Solar Network journey
                    with friends!
                  </p>

                  <div class="flex gap-3">
                    <n-button
                      type="primary"
                      size="large"
                      @click="downloadSummary"
                    >
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

                <div
                  class="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl"
                >
                  <h3 class="text-xl font-bold mb-4">What's Next?</h3>
                  <p class="opacity-80">
                    Keep creating, connecting, and exploring. Your 2026 rewind
                    will be even more amazing!
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
  MessageCircleHeartIcon,
  HeartIcon,
  StarIcon,
  CalendarDaysIcon,
  PencilLineIcon,
  DownloadIcon,
  ShareIcon,
  PartyPopperIcon
} from "lucide-vue-next"
import { ref, onMounted, onUnmounted } from "vue"
import { DateTime } from "luxon"
import type {
  SnRewind,
  SnRewindMostCalledChat,
  SnRewindChat,
  SnRewindChatMember
} from "~/types/api"

import CloudyRewind from "~/assets/images/cloudy-lamb-rewind.png"

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
    rootMargin: "0px 0px -50px 0px"
  }

  const createObserver = (
    element: HTMLElement,
    inViewRef: { value: boolean }
  ) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
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
  observers.forEach((observer) => observer.disconnect())
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

const getChatRoomAvatar = (item: SnRewindChat) => {
  const apiBase = useSolarNetworkUrl()
  return item.picture
    ? `${apiBase}/drive/files/${item.picture.id}`
    : "/api/placeholder/48/48"
}

const getChatMemberAvatar = (member: SnRewindChatMember) => {
  const apiBase = useSolarNetworkUrl()
  return member.account?.profile?.picture
    ? `${apiBase}/drive/files/${member.account.profile.picture.id}`
    : "/api/placeholder/64/64"
}

// Download functionality
const downloadSummary = () => {
  // Create a simple text summary for download
  const summary = `
Solar Network Rewind ${rewindData.value?.year}
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
  const text = `Just checked out my Solar Network Rewind ${rewindData.value?.year}! 🚀\n\nI made ${rewindData.value?.data.sphere.totalPostCount} posts and got ${rewindData.value?.data.sphere.totalUpvoteCount} upvotes. What was your highlight of the year?`

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

// Helper methods for streak messages
const getStreakMessage = (streak: number): string => {
  if (streak >= 365) {
    return "年度签到王"
  } else if (streak >= 300) {
    return "签到狂人"
  } else if (streak >= 200) {
    return "签到达人"
  } else if (streak >= 100) {
    return "签到高手"
  } else if (streak >= 50) {
    return "签到积极分子"
  } else if (streak >= 20) {
    return "签到新手"
  } else {
    return "继续签到"
  }
}

const getStreakDescription = (streak: number): string => {
  if (streak >= 365) {
    return `连续签到 ${streak} 天，你就是 Solar Network 的签到传奇`
  } else if (streak >= 300) {
    return `连续签到 ${streak} 天，你的坚持让人佩服`
  } else if (streak >= 200) {
    return `连续签到 ${streak} 天，签到已经成为你的习惯`
  } else if (streak >= 100) {
    return `连续签到 ${streak} 天，你真的很用心在使用 Solar Network`
  } else if (streak >= 50) {
    return `连续签到 ${streak} 天，继续保持这个好习惯`
  } else if (streak >= 20) {
    return `连续签到 ${streak} 天，开始养成好习惯`
  } else {
    return `连续签到 ${streak} 天，每天签到让生活更有仪式感`
  }
}

useHead({
  title: "Solar Network Rewind 2025",
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
.scroll-section:nth-child(1).animate-in {
  transition-delay: 0.1s;
}
.scroll-section:nth-child(2).animate-in {
  transition-delay: 0.2s;
}
.scroll-section:nth-child(3).animate-in {
  transition-delay: 0.3s;
}
.scroll-section:nth-child(4).animate-in {
  transition-delay: 0.4s;
}
.scroll-section:nth-child(5).animate-in {
  transition-delay: 0.5s;
}
.scroll-section:nth-child(6).animate-in {
  transition-delay: 0.6s;
}
</style>
