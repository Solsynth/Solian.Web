<template>
  <div class="px-5">
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
          class="scroll-section min-h-screen flex items-center justify-center"
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
                <div class="text-md opacity-80">
                  {{
                    getStreakDescription(rewindData.data.pass.maxCheckInStreak)
                  }}
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 2: Lotteries -->
        <div
          class="scroll-section min-h-screen flex items-center justify-center"
        >
          <n-card
            class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon
                  size="28"
                  :component="PartyPopperIcon"
                  class="text-purple-600"
                />
                <h2 class="text-2xl font-bold">彩票游戏</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-6">
                <div class="grid grid-cols-1 gap-4">
                  <n-statistic label="获胜次数" tabular-nums>
                    <n-number-animation
                      :to="rewindData.data.pass.lotteriesWins"
                    />
                    <template #suffix>次</template>
                  </n-statistic>
                  <n-statistic label="失败次数" tabular-nums>
                    <n-number-animation
                      :to="rewindData.data.pass.lotteriesLosses"
                    />
                    <template #suffix>次</template>
                  </n-statistic>
                  <n-statistic label="胜率" tabular-nums>
                    <n-number-animation
                      :to="rewindData.data.pass.lotteriesWinRate * 100"
                      :precision="1"
                    />
                    <template #suffix>%</template>
                  </n-statistic>
                </div>
              </div>

              <div class="md:text-right pr-4 max-md:order-first">
                <div class="text-5xl mb-3">
                  {{
                    rewindData.data.pass.lotteriesWinRate >= 0.5 ? "🎉" : "😅"
                  }}
                </div>
                <div class="text-2xl font-bold mb-1">
                  {{ getLotteryMessage(rewindData.data.pass.lotteriesWinRate) }}
                </div>
                <div class="text-md opacity-80">
                  {{
                    getLotteryDescription(rewindData.data.pass.lotteriesWinRate)
                  }}
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 3: Social Connections -->
        <div
          class="scroll-section min-h-screen flex items-center justify-center"
        >
          <n-card
            class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon
                  size="28"
                  :component="HeartIcon"
                  class="text-pink-600"
                />
                <h2 class="text-2xl font-bold">社交连接</h2>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-6">
                <div class="grid grid-cols-1 gap-4">
                  <n-statistic label="新增好友" tabular-nums>
                    <n-number-animation
                      :to="rewindData.data.pass.newFriendsCount"
                    />
                    <template #suffix>人</template>
                  </n-statistic>
                  <n-statistic label="新增屏蔽" tabular-nums>
                    <n-number-animation
                      :to="rewindData.data.pass.newBlockedCount"
                    />
                    <template #suffix>人</template>
                  </n-statistic>
                </div>
              </div>

              <div class="md:text-right pr-4 max-md:order-first">
                <div class="text-5xl mb-3">🤝</div>
                <div class="text-2xl font-bold mb-1">
                  {{
                    getConnectionMessage(
                      rewindData.data.pass.newFriendsCount,
                      rewindData.data.pass.newBlockedCount
                    )
                  }}
                </div>
                <div class="text-md opacity-80">
                  {{
                    getConnectionDescription(
                      rewindData.data.pass.newFriendsCount,
                      rewindData.data.pass.newBlockedCount
                    )
                  }}
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 4: Creator Career Overview -->
        <div
          class="scroll-section min-h-screen flex items-center justify-center"
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

        <!-- Section 5: Word Cloud -->
        <div
          class="scroll-section min-h-screen flex items-center justify-center"
        >
          <n-card
            class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon
                  size="28"
                  :component="MessageCircleIcon"
                  class="text-blue-600"
                />
                <h2 class="text-2xl font-bold">词汇云</h2>
              </div>
            </template>

            <div class="text-center">
              <div class="text-5xl mb-6">☁️</div>
              <div class="text-2xl font-bold mb-4">你的年度词汇</div>
              <div class="text-md opacity-80 mb-8">
                这些是你最常使用的词汇，反映了你的表达方式和兴趣
              </div>

              <div
                class="flex flex-wrap justify-center items-center gap-4 max-w-3xl mx-auto"
              >
                <span
                  v-for="word in rewindData.data.sphere.topWords"
                  :key="word.word"
                  :class="getWordCloudClass(word.count)"
                  class="inline-block transition-all duration-300 hover:scale-110 cursor-default"
                  :title="`${word.word}: ${word.count} 次`"
                >
                  <n-tooltip>
                    <template #trigger>
                      {{ word.word }}
                    </template>
                    {{ word.count }} 次使用
                  </n-tooltip>
                </span>
              </div>

              <div class="mt-8 text-sm opacity-60">
                词汇使用频率越高，字体越大
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 3: Explore History -->
        <div
          class="scroll-section min-h-screen flex items-center justify-center"
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
                <div class="text-4xl">❤️</div>
                <p class="text-lg">
                  看起来你真的喜欢他/她呢<br />
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
          class="scroll-section min-h-screen flex items-center justify-center"
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
                            rewindData.data.sphere.mostMessagedChat.chat
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
                <div>
                  <h3 class="font-bold mb-2 flex items-center gap-2">
                    <n-icon :component="PhoneCallIcon" size="16" />
                    通话时间最长的聊天室
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
                          rewindData.data.sphere.mostCalledChat.chat.name?.substring(
                            0,
                            1
                          )
                        }}</n-avatar
                      >
                      <div class="grow flex flex-col">
                        <div class="text-md font-bold">
                          {{ rewindData.data.sphere.mostCalledChat.chat.name }}
                        </div>
                        <p>
                          <n-number-animation
                            :to="rewindData.data.sphere.mostCalledChat.duration"
                          />
                          分钟
                        </p>
                      </div>
                    </div>
                    <p class="mt-2 text-opacity-80">
                      与这些人一起达成这样的成就
                    </p>
                    <div
                      v-if="
                        rewindData.data.sphere.mostCalledAccounts.length > 0
                      "
                      class="flex justify-start gap-4 mt-2"
                    >
                      <div
                        v-for="item in rewindData.data.sphere
                          .mostCalledChatTopMembers"
                        :key="item.id"
                      >
                        <n-tooltip>
                          <template #trigger>
                            <n-avatar
                              object-fit="cover"
                              :src="getAccountAvatar(item)"
                            />
                          </template>
                          {{ item.nick }}
                        </n-tooltip>
                      </div>
                    </div>
                  </n-card>
                </div>
                <div>
                  <h3 class="font-bold mb-2 flex items-center gap-2">
                    <n-icon :component="WebhookIcon" size="16" />
                    通话时间前三名
                  </h3>
                  <n-card
                    v-if="rewindData.data.sphere.mostCalledAccounts.length > 0"
                    size="small"
                  >
                    <div class="flex justify-start gap-4 mt-2">
                      <div
                        v-for="item in rewindData.data.sphere
                          .mostCalledAccounts"
                        :key="item.account.id"
                      >
                        <div
                          class="flex flex-col justify-center items-center text-center gap-2"
                        >
                          <n-avatar
                            object-fit="cover"
                            :src="getAccountAvatar(item.account)"
                          />
                          <div>
                            <div class="text-md font-bold">
                              {{ item.account.nick }}
                            </div>
                            <p class="text-sm opacity-80">
                              {{ item.duration }} 分钟
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </n-card>
                </div>
              </div>
              <div class="text-right flex flex-col justify-center px-5 gap-2">
                <div class="text-5xl mb-3">💬</div>
                <div class="text-2xl font-bold">
                  {{ getChatMessage(getTotalMessages(rewindData.data.sphere)) }}
                </div>
                <div class="text-md opacity-80">
                  {{
                    getChatDescription(getTotalMessages(rewindData.data.sphere))
                  }}
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- Section 6: Summary -->
        <div
          class="scroll-section min-h-screen flex items-center justify-center"
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
                    <div class="text-sm">
                      <span class="font-medium opacity-80"
                        >Top Connections:</span
                      >
                    </div>
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
  PartyPopperIcon,
  PhoneCallIcon,
  WebhookIcon
} from "lucide-vue-next"
import { ref } from "vue"
import type {
  SnAccount,
  SnRewind,
  SnRewindChat,
  SnRewindChatMember
} from "~/types/api"

import CloudyRewind from "~/assets/images/cloudy-lamb-rewind.png"

const api = useSolarNetwork()

const pending = ref(true)
const error = ref<unknown>(null)
const rewindData = ref<SnRewind | null>(null)

// No animation refs needed for CSS-only animations

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

onMounted(() => fetchRewindData())

// Helper methods

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

const getAccountAvatar = (account: SnAccount) => {
  const apiBase = useSolarNetworkUrl()
  return account?.profile?.picture
    ? `${apiBase}/drive/files/${account.profile.picture.id}`
    : "/api/placeholder/32/32"
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

// Helper methods for chat messages
const getTotalMessages = (data: SnRewind["data"]["sphere"]): number => {
  return (
    (data.mostMessagedDirectChat?.messageCounts || 0) +
    (data.mostMessagedChat?.messageCounts || 0)
  )
}

const getChatMessage = (totalMessages: number): string => {
  if (totalMessages >= 10000) {
    return "社交达人"
  } else if (totalMessages >= 5000) {
    return "聊天狂人"
  } else if (totalMessages >= 2000) {
    return "活跃分子"
  } else if (totalMessages >= 1000) {
    return "话痨本痨"
  } else if (totalMessages >= 500) {
    return "健谈人士"
  } else if (totalMessages >= 100) {
    return "社交新人"
  } else {
    return "继续聊天"
  }
}

const getChatDescription = (totalMessages: number): string => {
  if (totalMessages >= 10000) {
    return `发送了 ${totalMessages} 条消息，你就是 Solar Network 的社交传奇`
  } else if (totalMessages >= 5000) {
    return `发送了 ${totalMessages} 条消息，你的聊天热情无人能及`
  } else if (totalMessages >= 2000) {
    return `发送了 ${totalMessages} 条消息，聊天已经成为你的日常`
  } else if (totalMessages >= 1000) {
    return `发送了 ${totalMessages} 条消息，你真的很爱在 Solar Network 上聊天`
  } else if (totalMessages >= 500) {
    return `发送了 ${totalMessages} 条消息，继续保持这个交流习惯`
  } else if (totalMessages >= 100) {
    return `发送了 ${totalMessages} 条消息，开始享受 Solar Network 的社交功能`
  } else {
    return `发送了 ${totalMessages} 条消息，多多交流让社区更精彩`
  }
}

// Helper methods for lottery messages
const getLotteryMessage = (winRate: number): string => {
  if (winRate >= 0.8) {
    return "彩票之神"
  } else if (winRate >= 0.6) {
    return "幸运儿"
  } else if (winRate >= 0.4) {
    return "运气不错"
  } else if (winRate >= 0.2) {
    return "继续加油"
  } else {
    return "试试手气"
  }
}

const getLotteryDescription = (winRate: number): string => {
  if (winRate >= 0.8) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，看来你就是传说中的欧皇`
  } else if (winRate >= 0.6) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，你的运气真的很不错`
  } else if (winRate >= 0.4) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，运气还可以，继续保持`
  } else if (winRate >= 0.2) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，有时候运气就是这样`
  } else {
    return `胜率 ${(winRate * 100).toFixed(1)}%，新的一年希望你能转运`
  }
}

// Helper methods for connection messages
const getConnectionMessage = (friends: number, blocked: number): string => {
  if (friends > blocked * 2) {
    return "社交之星"
  } else if (friends > blocked) {
    return "友好使者"
  } else if (blocked > friends) {
    return "谨慎选择"
  } else {
    return "平衡发展"
  }
}

const getConnectionDescription = (friends: number, blocked: number): string => {
  if (friends > blocked * 2) {
    return `新增了 ${friends} 位好友，只有 ${blocked} 位屏蔽，你的社交圈在不断扩大`
  } else if (friends > blocked) {
    return `新增了 ${friends} 位好友，${blocked} 位屏蔽，你善于结识新朋友`
  } else if (blocked > friends) {
    return `新增了 ${friends} 位好友，但屏蔽了 ${blocked} 位，你对社交比较谨慎`
  } else {
    return `新增了 ${friends} 位好友，屏蔽了 ${blocked} 位，你的社交选择很平衡`
  }
}

// Helper method for word cloud styling
const getWordCloudClass = (count: number): string => {
  if (count >= 1000) {
    return "text-4xl font-bold text-blue-600"
  } else if (count >= 500) {
    return "text-3xl font-semibold text-green-600"
  } else if (count >= 200) {
    return "text-2xl font-medium text-purple-600"
  } else if (count >= 100) {
    return "text-xl font-medium text-pink-600"
  } else if (count >= 50) {
    return "text-lg font-normal text-indigo-600"
  } else if (count >= 20) {
    return "text-base font-normal text-teal-600"
  } else {
    return "text-sm font-normal text-gray-600"
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
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scroll-section {
  animation: fadeInUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  opacity: 0;
  transform: translateY(30px);
}

/* Staggered animation delays */
.scroll-section:nth-child(1) {
  animation-delay: 0.1s;
}
.scroll-section:nth-child(2) {
  animation-delay: 0.2s;
}
.scroll-section:nth-child(3) {
  animation-delay: 0.3s;
}
.scroll-section:nth-child(4) {
  animation-delay: 0.4s;
}
.scroll-section:nth-child(5) {
  animation-delay: 0.5s;
}
.scroll-section:nth-child(6) {
  animation-delay: 0.6s;
}
.scroll-section:nth-child(7) {
  animation-delay: 0.7s;
}
</style>
