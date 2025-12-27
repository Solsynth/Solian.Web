<template>
  <div class="px-5">
    <!-- Loading State -->
    <div
      v-if="pending"
      class="text-center py-12 min-h-compact-layout flex flex-col justify-center"
    >
      <n-spin size="large" />
      <p class="mt-4 text-lg">正在整理你的回顾数据……</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="text-center py-12 min-h-compact-layout flex flex-col justify-center max-w-2xl mx-auto"
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
    <div v-else-if="rewindData" id="intro" class="mx-auto">
      <!-- Header Section -->
      <div class="header text-center mb-8 min-h-compact-layout flex flex-col justify-center relative">
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
        <div class="scroll-hint absolute bottom-10 left-1/2 -translate-x-1/2">
          <p class="text-sm opacity-60 mb-2">向下滚动以开始</p>
          <n-icon :component="ArrowDown" class="animate-bounce w-6 h-6 text-gray-500 mx-auto" />
        </div>
      </div>

      <!-- Scroll-based Sections -->
      <div class="space-y-48">
        <!-- Section 1: Activity Data -->
        <div
          id="activity"
          class="scroll-section min-h-compact-layout flex items-center justify-center"
        >
          <n-card class="w-full max-w-4xl shadow-xl border-l-4 border-blue-600">
            <template #header>
              <div class="flex items-center gap-3">
                <n-icon
                  size="28"
                  :component="CalendarDaysIcon"
                  class="text-blue-600"
                />
                <h2 class="text-2xl font-bold">你的数字足迹</h2>
                <p class="text-sm opacity-60 -mt-2">看看过去一年里你在 Solar Network 的点点滴滴</p>
              </div>
            </template>

            <div class="floating-emoji absolute -top-4 -left-4 text-5xl z-10"
                 style="animation: float-delayed 8s ease-in-out infinite;">📅
            </div>
            <div class="floating-emoji absolute bottom-4 right-8 text-4xl z-10"
                 style="animation: drift 10s ease-in-out infinite;">⭐
            </div>
            <div class="floating-emoji absolute top-1/2 -left-8 text-5xl z-10"
                 style="animation: float 7s ease-in-out infinite 1s;">✨
            </div>
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

        <div class="transition-words text-center text-lg opacity-70 py-16">
          <div class="text-3xl mb-3">🎯</div>
          <p>这一年，你的坚持令人敬佩。但生活不只有坚持，还有……</p>
        </div>

        <!-- Section 2: Games & Social -->
        <div
          id="lotteries-and-friends"
          class="scroll-section min-h-compact-layout flex items-center justify-center"
        >
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full max-w-4xl relative">
            <div class="floating-emoji absolute -top-8 -left-4 text-5xl z-10"
                 style="animation: float 5s ease-in-out infinite;">🎉
            </div>
            <div class="floating-emoji absolute top-1/3 -right-8 text-4xl z-10"
                 style="animation: float-delayed 6s ease-in-out infinite 0.5s;">🎲
            </div>
            <div class="floating-emoji absolute -bottom-4 left-1/4 text-5xl z-10"
                 style="animation: drift 9s ease-in-out infinite;">🤝
            </div>
            <div class="floating-emoji absolute top-2/3 -left-6 text-4xl z-10"
                 style="animation: float 8s ease-in-out infinite 1.5s;">💖
            </div>
            <n-card
              class="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-l-4 border-purple-600"
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

            <n-card
              class="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-l-4 border-pink-600"
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
        </div>

        <div class="transition-words text-center text-lg opacity-70 py-16">
          <div class="text-3xl mb-3">🎨</div>
          <p>社交之外，你还在用自己的方式创造着价值……</p>
        </div>

        <!-- Section 4: Creator Career Overview -->
        <div
          id="creator"
          class="scroll-section min-h-compact-layout flex items-center justify-center"
        >
          <div class="relative">
            <div class="floating-emoji absolute -top-6 right-1/4 text-5xl z-10"
                 style="animation: float 6s ease-in-out infinite;">✏️
            </div>
            <div class="floating-emoji absolute top-1/4 -left-6 text-4xl z-10"
                 style="animation: float-delayed 7s ease-in-out infinite 0.3s;">🎨
            </div>
            <div class="floating-emoji absolute bottom-1/3 -right-4 text-5xl z-10"
                 style="animation: drift 8s ease-in-out infinite;">💡
            </div>
            <div class="floating-emoji absolute top-2/3 right-1/4 text-4xl z-10"
                 style="animation: float 9s ease-in-out infinite 1s;">📝
            </div>
            <n-card
              class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-l-4 border-green-600"
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

              <n-card embedded class="text-center mb-6">
                <div class="text-4xl mb-3">✨</div>
                <div class="text-2xl font-bold mb-1">
                  {{ getCreatorMessage(rewindData.data.sphere.totalPostCount)
                  }}
                </div>
                <div class="text-md opacity-80">
                  {{ getCreatorDescription(rewindData.data.sphere.totalPostCount, rewindData.data.sphere.totalUpvoteCount)
                  }}
                </div>
              </n-card>

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
        </div>

        <div class="transition-words text-center text-lg opacity-70 py-16">
          <div class="text-3xl mb-3">🎨</div>
          <p>每一个创作都是你心灵的印记，而这些印记汇聚成了什么？</p>
        </div>

        <!-- Section 5: Word Cloud -->
        <div
          id="top-words"
          class="scroll-section min-h-compact-layout flex items-center justify-center"
        >
          <div class="relative">
            <div class="floating-emoji absolute -top-8 left-1/3 text-5xl z-10"
                 style="animation: float 5s ease-in-out infinite;">☁️
            </div>
            <div class="floating-emoji absolute top-1/4 -right-6 text-4xl z-10"
                 style="animation: float-delayed 7s ease-in-out infinite 0.5s;">💬
            </div>
            <div class="floating-emoji absolute bottom-1/4 -left-4 text-5xl z-10"
                 style="animation: drift 9s ease-in-out infinite;">💭
            </div>
            <div class="floating-emoji absolute top-2/3 right-1/3 text-4xl z-10"
                 style="animation: float 8s ease-in-out infinite 1.2s;">✨
            </div>
            <n-card
              class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-l-4 border-blue-600"
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
        </div>

        <div class="transition-words text-center text-lg opacity-70 py-16">
          <div class="text-3xl mb-3">🔍</div>
          <p>除了创作自己的世界，你也在探索别人的精彩……</p>
        </div>

        <!-- Section 3: Explore History -->
        <div
          id="discovery"
          class="scroll-section min-h-compact-layout flex items-center justify-center"
        >
          <div class="relative">
            <div class="floating-emoji absolute -top-6 -right-4 text-5xl z-10"
                 style="animation: float 6s ease-in-out infinite;">🌍
            </div>
            <div class="floating-emoji absolute top-1/3 -left-6 text-4xl z-10"
                 style="animation: float-delayed 8s ease-in-out infinite 0.4s;">🔍
            </div>
            <div class="floating-emoji absolute bottom-1/4 right-1/4 text-5xl z-10"
                 style="animation: drift 10s ease-in-out infinite;">🎯
            </div>
            <div class="floating-emoji absolute top-2/3 -right-8 text-4xl z-10"
                 style="animation: float 7s ease-in-out infinite 1.5s;">📊
            </div>
            <n-card
              class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-l-4 border-indigo-600"
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
        </div>

        <div class="transition-words text-center text-lg opacity-70 py-16">
          <div class="text-3xl mb-3">💬</div>
          <p>在探索精彩内容的路上，你并不孤单，因为有……</p>
        </div>

        <!-- Section 4: Chat Summary -->
        <div
          id="chat"
          class="scroll-section min-h-compact-layout flex items-center justify-center"
        >
          <div class="relative">
            <div class="floating-emoji absolute -top-8 left-1/4 text-5xl z-10"
                 style="animation: float 5s ease-in-out infinite;">💬
            </div>
            <div class="floating-emoji absolute top-1/4 -right-4 text-4xl z-10"
                 style="animation: float-delayed 6s ease-in-out infinite 0.6s;">💕
            </div>
            <div class="floating-emoji absolute bottom-1/3 -left-6 text-5xl z-10"
                 style="animation: drift 8s ease-in-out infinite;">📞
            </div>
            <div class="floating-emoji absolute top-2/3 right-1/3 text-4xl z-10"
                 style="animation: float 7s ease-in-out infinite 1.8s;">🎭
            </div>
            <n-card
              class="w-full max-w-4xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-l-4 border-teal-600"
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
                          }}
                        </n-avatar
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
                          }}
                        </n-avatar
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
        </div>

        <div class="transition-words text-center text-lg opacity-70 py-16">
          <div class="text-3xl mb-3">🏆</div>
          <p>时光飞逝，让我们一起回顾这一年的精彩……</p>
        </div>

        <!-- Section 6: Summary -->
        <div
          id="summary"
          class="scroll-section min-h-compact-layout flex items-center justify-center"
        >
          <div class="relative">
            <div class="floating-emoji absolute -top-10 left-1/3 text-6xl z-10"
                 style="animation: float 6s ease-in-out infinite;">🏆
            </div>
            <div class="floating-emoji absolute top-1/4 -right-6 text-5xl z-10"
                 style="animation: float-delayed 7s ease-in-out infinite 0.7s;">🎊
            </div>
            <div class="floating-emoji absolute bottom-1/3 -left-8 text-6xl z-10"
                 style="animation: drift 9s ease-in-out infinite;">🎆
            </div>
            <div class="floating-emoji absolute top-1/2 -right-12 text-4xl z-10"
                 style="animation: float 10s ease-in-out infinite 0.3s;">🌟
            </div>
            <n-card
              class="w-full max-w-7xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg"
            >
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="space-y-6">
                  <n-card embedded>
                    <h3 class="text-xl font-bold mb-4">📊 年度数据概览</h3>
                    <div class="space-y-3">
                      <div class="flex justify-between items-center">
                        <span class="opacity-80">发帖总数</span>
                        <span class="font-bold">{{
                            rewindData.data.sphere.totalPostCount
                          }} 篇</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="opacity-80">获得顶赞</span>
                        <span class="font-bold">{{
                            rewindData.data.sphere.totalUpvoteCount
                          }} 个</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="opacity-80">最长连续签到</span>
                        <span class="font-bold">{{
                            rewindData.data.pass.maxCheckInStreak
                          }} 天</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="opacity-80">彩票胜率</span>
                        <span class="font-bold">{{
                            (rewindData.data.pass.lotteriesWinRate * 100).toFixed(1)
                          }}%</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="opacity-80">新增好友</span>
                        <span class="font-bold">{{
                            rewindData.data.pass.newFriendsCount
                          }} 人</span>
                      </div>
                    </div>
                  </n-card>

                  <n-card embedded>
                    <h3 class="text-xl font-bold mb-4">🎯 创作亮点</h3>
                    <div class="space-y-3">
                      <div>
                        <span class="font-medium opacity-80">高产日:</span>
                        <span class="font-bold ml-2">{{
                            rewindData.data.sphere.mostProductiveDay.date.split(" ")[0]?.split("/").slice(0, 2).join("/")
                          }} 发布了 {{
                            rewindData.data.sphere.mostProductiveDay.postCount
                          }} 篇帖子</span>
                      </div>
                      <div>
                        <span class="font-medium opacity-80">最受欢迎帖子:</span>
                        <span
                          class="font-bold ml-2">{{ rewindData.data.sphere.mostPopularPost.title || "分享媒体" }}</span>
                      </div>
                      <div>
                        <span class="font-medium opacity-80">最爱创作者:</span>
                        <span class="font-bold ml-2">{{
                            rewindData.data.sphere.mostLovedPublisher.publisher.nick
                          }}</span>
                      </div>
                    </div>
                  </n-card>

                  <n-card embedded>
                    <h3 class="text-xl font-bold mb-4">💬 社交活跃度</h3>
                    <div class="space-y-3">
                      <div>
                        <span class="font-medium opacity-80">最常出没:</span>
                        <span class="font-bold ml-2">{{
                            rewindData.data.sphere.mostMessagedChat.chat.name || "聊天室"
                          }}</span>
                      </div>
                      <div>
                        <span class="font-medium opacity-80">发送消息:</span>
                        <span class="font-bold ml-2">{{
                            getTotalMessages(rewindData.data.sphere)
                          }} 条</span>
                      </div>
                      <div>
                        <span class="font-medium opacity-80">通话时长:</span>
                        <span class="font-bold ml-2">{{
                            rewindData.data.sphere.mostCalledChat.duration
                          }} 分钟</span>
                      </div>
                    </div>
                  </n-card>
                </div>

                <div class="space-y-6">
                  <n-card embedded>
                    <h3 class="text-xl font-bold mb-4">🏆 个人成就</h3>
                    <div class="space-y-3">
                      <div class="text-center">
                        <div class="text-2xl mb-2">🏅</div>
                        <div class="font-bold text-lg">{{
                            getStreakMessage(rewindData.data.pass.maxCheckInStreak)
                          }}
                        </div>
                        <div class="text-sm opacity-80">签到成就</div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl mb-2">{{
                            rewindData.data.pass.lotteriesWinRate >= 0.5 ? "🎰" : "🎲"
                          }}
                        </div>
                        <div class="font-bold text-lg">{{
                            getLotteryMessage(rewindData.data.pass.lotteriesWinRate)
                          }}
                        </div>
                        <div class="text-sm opacity-80">彩票成就</div>
                      </div>
                      <div class="text-center">
                        <div class="text-2xl mb-2">🤝</div>
                        <div class="font-bold text-lg">{{
                            getConnectionMessage(rewindData.data.pass.newFriendsCount, rewindData.data.pass.newBlockedCount)
                          }}
                        </div>
                        <div class="text-sm opacity-80">社交成就</div>
                      </div>
                    </div>
                  </n-card>

                  <n-card embedded>
                    <h3 class="text-xl font-bold mb-4">🚀 新一年展望</h3>
                    <p class="opacity-80">
                      继续创作、连接和探索。你的 {{ rewindData.year + 1 }} 年度回顾将会更加精彩！
                    </p>
                    <div class="mt-4 text-sm opacity-60">
                      ✨ 保持良好的创作习惯<br>
                      💬 继续与朋友保持联系<br>
                      🎯 挑战更高的目标
                    </div>
                  </n-card>
                </div>

                <div class="flex justify-between gap-4 w-full md:col-span-2">
                  <div class="flex gap-4 items-center">
                    <n-avatar :src="getAccountAvatar(userInfo.user!)" />
                    <div class="flex flex-col">
                      <p class="text-md font-bold">{{ userInfo.user!.nick }} 的 {{ rewindData.year }} 年</p>
                      <p>@{{ userInfo.user!.name }}</p>
                    </div>
                  </div>
                  <div class="flex gap-4 items-center text-right">
                    <div class="flex flex-col">
                      <p class="text-md font-bold">Solar Network Rewind</p>
                      <p>2024/12/26 - 2025/12/25</p>
                    </div>
                    <img :src="CloudyLamb" style="width: 34px; aspect-ratio: 1" />
                  </div>
                </div>
              </div>
            </n-card>
          </div>
        </div>

        <div class="transition-words text-center text-lg opacity-70 py-16">
          <div class="text-3xl mb-3">✨</div>
          <p>新的一年即将开始，让我们带着这些美好的回忆继续前行！</p>
        </div>

        <div class="min-h-compact-layout flex items-center justify-center ">
          <n-card class="w-full max-w-xl relative">
            <div class="floating-emoji absolute -top-20 left-10 text-4xl z-10"
                 style="animation: float 5s ease-in-out infinite;">🎁
            </div>
            <div class="floating-emoji absolute top-0 -right-20 text-3xl z-10"
                 style="animation: float-delayed 6s ease-in-out infinite 0.5s;">💌
            </div>
            <div class="floating-emoji absolute bottom-0 -left-20 text-4xl z-10"
                 style="animation: drift 8s ease-in-out infinite;">🎊
            </div>

            <p class="opacity-80 mb-4 text-center">
              与朋友分享你在 Solar Network 的精彩旅程！
            </p>

            <div class="flex gap-3 justify-center">
              <n-button
                type="primary"
                size="large"
                @click="downloadSummary"
              >
                <template #icon>
                  <n-icon :component="DownloadIcon" />
                </template>
                下载总结
              </n-button>
              <n-button size="large" @click="shareOnSocial">
                <template #icon>
                  <n-icon :component="ShareIcon" />
                </template>
                分享到社交媒体
              </n-button>
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
  CalendarDaysIcon,
  PencilLineIcon,
  DownloadIcon,
  ShareIcon,
  PartyPopperIcon,
  PhoneCallIcon,
  WebhookIcon,
  ArrowDown
} from "lucide-vue-next"
import { ref } from "vue"
import type {
  SnAccount,
  SnRewind,
  SnRewindChat,
  SnRewindChatMember
} from "~/types/api"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import CloudyRewind from "~/assets/images/cloudy-lamb-rewind.png"
import CloudyLamb from "~/assets/images/cloudy-lamb.png"

const api = useSolarNetwork()
const userInfo = useUserStore()

const pending = ref(true)
const error = ref<unknown>(null)
const rewindData = ref<SnRewind | null>(null)

gsap.registerPlugin(ScrollTrigger)

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

onMounted(async () => {
  await fetchRewindData()

  // Ensure DOM is updated before running GSAP
  await nextTick()

  if (rewindData.value) {
    // Animate the header
    gsap.from(".header", {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: "power3.out"
    })

    // Animate sections on scroll
    const sections = gsap.utils.toArray<HTMLElement>(".scroll-section")
    sections.forEach((section) => {
      gsap.from(section, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%", // Animation starts when the top of the section is 80% from the top of the viewport
          end: "bottom 20%",
          toggleActions: "play none none none"
        }
      })
    })

    // Animate transition words
    const transitionWords = gsap.utils.toArray<HTMLElement>(".transition-words")
    transitionWords.forEach((transition) => {
      gsap.from(transition, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: transition,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      })
    })

    // Animate floating emojis
    const floatingEmojis = gsap.utils.toArray<HTMLElement>(".floating-emoji")
    floatingEmojis.forEach((emoji) => {
      gsap.from(emoji, {
        opacity: 0,
        scale: 0.5,
        rotation: -20,
        duration: 1,
        ease: "elastic.out(1, 0.5)",
        scrollTrigger: {
          trigger: emoji,
          start: "top 90%",
          toggleActions: "play none none none"
        }
      })
    })
  }
})

onBeforeUnmount(() => {
  // Kill all ScrollTriggers to prevent memory leaks
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
})


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

const message = useMessage()

// Download functionality
const downloadSummary = async () => {
  try {
    // Import html2canvas dynamically
    const html2canvas = (await import("html2canvas")).default

    // Find the summary section
    const summarySection = document.querySelector("#summary") as HTMLElement

    if (!summarySection) {
      console.error("Summary section not found")
      return
    }

    // Configure html2canvas options for better quality
    const canvas = await html2canvas(summarySection, {
      backgroundColor: "#ffffff",
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: false,
      width: summarySection.offsetWidth,
      height: summarySection.offsetHeight
    })

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to create image blob")
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `solar-network-rewind-${rewindData.value?.year}-summary.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, "image/png", 1.0)

  } catch (error: unknown) {
    message.error(`导出失败…… ${error}`)
  }
}

const shareOnSocial = () => {
  const text = `Just checked out my Solar Network Rewind ${rewindData.value?.year}! 🚀\n\nI made ${rewindData.value?.data.sphere.totalPostCount} posts and got ${rewindData.value?.data.sphere.totalUpvoteCount} upvotes. What was your highlight of the year?`

  if (navigator.share) {
    navigator.share({
      title: "Solar Network Rewind",
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
  } else if (streak >= 340) {
    return "风雨无阻"
  } else if (streak >= 300) {
    return "签到狂人"
  } else if (streak >= 270) {
    return "持之以恒"
  } else if (streak >= 240) {
    return "坚持不懈"
  } else if (streak >= 200) {
    return "签到达人"
  } else if (streak >= 170) {
    return "锲而不舍"
  } else if (streak >= 140) {
    return "日积月累"
  } else if (streak >= 100) {
    return "签到高手"
  } else if (streak >= 70) {
    return "勤勉踏实"
  } else if (streak >= 50) {
    return "签到积极分子"
  } else if (streak >= 30) {
    return "初露锋芒"
  } else if (streak >= 20) {
    return "签到新手"
  } else if (streak >= 10) {
    return "循序渐进"
  } else if (streak >= 5) {
    return "小试牛刀"
  } else {
    return "继续签到"
  }
}

const getStreakDescription = (streak: number): string => {
  if (streak >= 365) {
    return `连续签到 ${streak} 天，你就是 Solar Network 的签到传奇，风雨无阻，日复一日`
  } else if (streak >= 340) {
    return `连续签到 ${streak} 天，无论刮风下雨，你从未缺席，这份执着令人动容`
  } else if (streak >= 300) {
    return `连续签到 ${streak} 天，你的坚持让人佩服，每一天都不曾懈怠`
  } else if (streak >= 270) {
    return `连续签到 ${streak} 天，持之以恒是你的代名词，每一天的积累都值得`
  } else if (streak >= 240) {
    return `连续签到 ${streak} 天，坚持不懈的精神让你在 Solar Network 上闪闪发光`
  } else if (streak >= 200) {
    return `连续签到 ${streak} 天，签到已经成为你的习惯，融入了生活的节奏`
  } else if (streak >= 170) {
    return `连续签到 ${streak} 天，锲而不舍的努力，让你的每一步都走得稳健`
  } else if (streak >= 140) {
    return `连续签到 ${streak} 天，日积月累的坚持，正一点点构筑你的成就`
  } else if (streak >= 100) {
    return `连续签到 ${streak} 天，你真的很用心在使用 Solar Network，这份热情令人感动`
  } else if (streak >= 70) {
    return `连续签到 ${streak} 天，勤勉踏实的态度，让你的每一天都充满意义`
  } else if (streak >= 50) {
    return `连续签到 ${streak} 天，继续保持这个好习惯，坚持下去会有惊喜`
  } else if (streak >= 30) {
    return `连续签到 ${streak} 天，初露锋芒的你，正在养成优秀的习惯`
  } else if (streak >= 20) {
    return `连续签到 ${streak} 天，开始养成好习惯，每一天的坚持都值得`
  } else if (streak >= 10) {
    return `连续签到 ${streak} 天，循序渐进，好习惯就是这样养成的`
  } else if (streak >= 5) {
    return `连续签到 ${streak} 天，小试牛刀，已经开始你的签到之旅了`
  } else {
    return `连续签到 ${streak} 天，每天签到让生活更有仪式感，继续加油`
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
  if (totalMessages >= 20000) {
    return "社交传说"
  } else if (totalMessages >= 15000) {
    return "话如泉涌"
  } else if (totalMessages >= 10000) {
    return "社交达人"
  } else if (totalMessages >= 7000) {
    return "健谈专家"
  } else if (totalMessages >= 5000) {
    return "聊天狂人"
  } else if (totalMessages >= 3000) {
    return "健谈达人"
  } else if (totalMessages >= 2000) {
    return "活跃分子"
  } else if (totalMessages >= 1000) {
    return "话痨本痨"
  } else if (totalMessages >= 500) {
    return "健谈人士"
  } else if (totalMessages >= 200) {
    return "社交新星"
  } else if (totalMessages >= 100) {
    return "社交新人"
  } else {
    return "继续聊天"
  }
}

const getChatDescription = (totalMessages: number): string => {
  if (totalMessages >= 20000) {
    return `发送了 ${totalMessages} 条消息，你就是 Solar Network 的社交传说，用文字编织了无数温暖的时刻`
  } else if (totalMessages >= 15000) {
    return `发送了 ${totalMessages} 条消息，话如泉涌的你在 Solar Network 上留下了深刻的印记`
  } else if (totalMessages >= 10000) {
    return `发送了 ${totalMessages} 条消息，你就是 Solar Network 的社交传奇，每一次交流都充满温度`
  } else if (totalMessages >= 7000) {
    return `发送了 ${totalMessages} 条消息，作为健谈专家，你用文字连接着无数朋友`
  } else if (totalMessages >= 5000) {
    return `发送了 ${totalMessages} 条消息，你的聊天热情无人能及，每一条消息都承载着故事`
  } else if (totalMessages >= 3000) {
    return `发送了 ${totalMessages} 条消息，作为健谈达人，你让每一次对话都变得有意义`
  } else if (totalMessages >= 2000) {
    return `发送了 ${totalMessages} 条消息，聊天已经成为你的日常，融入了你的生活节奏`
  } else if (totalMessages >= 1000) {
    return `发送了 ${totalMessages} 条消息，你真的很爱在 Solar Network 上聊天，这份热情感染着每个人`
  } else if (totalMessages >= 500) {
    return `发送了 ${totalMessages} 条消息，继续保持这个交流习惯，让友谊在对话中升温`
  } else if (totalMessages >= 200) {
    return `发送了 ${totalMessages} 条消息，作为社交新星，你正在点亮 Solar Network 的社交圈`
  } else if (totalMessages >= 100) {
    return `发送了 ${totalMessages} 条消息，开始享受 Solar Network 的社交功能，每一次交流都是成长`
  } else {
    return `发送了 ${totalMessages} 条消息，多多交流让社区更精彩，期待你的每一次发言`
  }
}

// Helper methods for lottery messages
const getLotteryMessage = (winRate: number): string => {
  if (winRate >= 0.9) {
    return "天选之子"
  } else if (winRate >= 0.8) {
    return "彩票之神"
  } else if (winRate >= 0.7) {
    return "命运眷顾"
  } else if (winRate >= 0.6) {
    return "幸运儿"
  } else if (winRate >= 0.5) {
    return "手气达人"
  } else if (winRate >= 0.4) {
    return "运气不错"
  } else if (winRate >= 0.3) {
    return "时来运转"
  } else if (winRate >= 0.2) {
    return "继续加油"
  } else {
    return "试试手气"
  }
}

const getLotteryDescription = (winRate: number): string => {
  if (winRate >= 0.9) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，天选之子！你的运气简直就是神迹`
  } else if (winRate >= 0.8) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，看来你就是传说中的欧皇，运气站在你这边`
  } else if (winRate >= 0.7) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，命运眷顾着你，好运常伴左右`
  } else if (winRate >= 0.6) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，你的运气真的很不错，让周围的人都羡慕`
  } else if (winRate >= 0.5) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，作为手气达人，你的每一次尝试都充满可能`
  } else if (winRate >= 0.4) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，运气还可以，继续保持这份期待`
  } else if (winRate >= 0.3) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，时来运转，说不定下一次就是你`
  } else if (winRate >= 0.2) {
    return `胜率 ${(winRate * 100).toFixed(1)}%，有时候运气就是这样，不放弃就有希望`
  } else {
    return `胜率 ${(winRate * 100).toFixed(1)}%，新的一年希望你能转运，好运总会降临`
  }
}

// Helper methods for connection messages
const getConnectionMessage = (friends: number, blocked: number): string => {
  const total = friends + blocked
  if (total === 0) {
    return "社交初学者"
  } else if (friends === 0 && blocked > 0) {
    return "独善其身"
  } else if (blocked === 0 && friends > 10) {
    return "社交之星"
  } else if (blocked === 0 && friends > 0) {
    return "友善使者"
  } else if (friends > blocked * 3) {
    return "社交领袖"
  } else if (friends > blocked * 2) {
    return "社交之星"
  } else if (friends > blocked) {
    return "友好使者"
  } else if (blocked > friends * 2) {
    return "谨慎选择"
  } else if (blocked > friends) {
    return "选择性社交"
  } else {
    return "平衡发展"
  }
}

const getConnectionDescription = (friends: number, blocked: number): string => {
  const total = friends + blocked
  if (total === 0) {
    return `今年专注于自己的世界，社交圈的大门随时为你敞开`
  } else if (friends === 0 && blocked > 0) {
    return `屏蔽了 ${blocked} 位，你懂得保护自己的心灵空间`
  } else if (blocked === 0 && friends > 10) {
    return `新增了 ${friends} 位好友，零屏蔽！社交之星的称号非你莫属`
  } else if (blocked === 0 && friends > 0) {
    return `新增了 ${friends} 位好友，零屏蔽，你的友善感染着所有人`
  } else if (friends > blocked * 3) {
    return `新增了 ${friends} 位好友，只有 ${blocked} 位屏蔽，你是社交圈的核心人物`
  } else if (friends > blocked * 2) {
    return `新增了 ${friends} 位好友，只有 ${blocked} 位屏蔽，你的社交圈在不断扩大`
  } else if (friends > blocked) {
    return `新增了 ${friends} 位好友，${blocked} 位屏蔽，你善于结识新朋友`
  } else if (blocked > friends * 2) {
    return `新增了 ${friends} 位好友，屏蔽了 ${blocked} 位，你对社交比较谨慎，保护自己很重要`
  } else if (blocked > friends) {
    return `新增了 ${friends} 位好友，但屏蔽了 ${blocked} 位，选择性社交让你更从容`
  } else {
    return `新增了 ${friends} 位好友，屏蔽了 ${blocked} 位，你的社交选择很平衡，张弛有度`
  }
}

// Helper method for creator activity evaluation
const getCreatorMessage = (postCount: number): string => {
  if (postCount >= 500) {
    return "创作巅峰"
  } else if (postCount >= 300) {
    return "高产出作者"
  } else if (postCount >= 200) {
    return "多产作家"
  } else if (postCount >= 100) {
    return "创作达人"
  } else if (postCount >= 50) {
    return "活跃创作者"
  } else if (postCount >= 20) {
    return "潜力新星"
  } else if (postCount >= 10) {
    return "初出茅庐"
  } else if (postCount >= 5) {
    return "创作者入门"
  } else {
    return "静待花开"
  }
}

const getCreatorDescription = (postCount: number, upvoteCount: number): string => {
  if (postCount >= 500) {
    return `发布了 ${postCount} 篇帖子，获得 ${upvoteCount} 个顶，你已经是 Solar Network 的创作巅峰`
  } else if (postCount >= 300) {
    return `发布了 ${postCount} 篇帖子，获得 ${upvoteCount} 个顶，作为高产出作者，你的勤奋令人钦佩`
  } else if (postCount >= 200) {
    return `发布了 ${postCount} 篇帖子，获得 ${upvoteCount} 个顶，作为多产作家，你的每一篇都是心血`
  } else if (postCount >= 100) {
    return `发布了 ${postCount} 篇帖子，获得 ${upvoteCount} 个顶，创作达人的称号你实至名归`
  } else if (postCount >= 50) {
    return `发布了 ${postCount} 篇帖子，获得 ${upvoteCount} 个顶，作为活跃创作者，你用作品丰富着社区`
  } else if (postCount >= 20) {
    return `发布了 ${postCount} 篇帖子，获得 ${upvoteCount} 个顶，作为潜力新星，你的未来可期`
  } else if (postCount >= 10) {
    return `发布了 ${postCount} 篇帖子，获得 ${upvoteCount} 个顶，初出茅庐的你正在开启创作之旅`
  } else if (postCount >= 5) {
    return `发布了 ${postCount} 篇帖子，获得 ${upvoteCount} 个顶，创作者的大门已经为你打开`
  } else {
    return `发布了 ${postCount} 篇帖子，获得 ${upvoteCount} 个顶，静待花开，你的每一次创作都珍贵`
  }
}

// Helper method for word cloud styling
const getWordCloudClass = (count: number): string => {
  if (count >= 2000) {
    return "text-5xl font-black text-blue-600 animate-pulse-slow"
  } else if (count >= 1000) {
    return "text-4xl font-bold text-blue-600"
  } else if (count >= 750) {
    return "text-4xl font-bold text-indigo-600"
  } else if (count >= 500) {
    return "text-3xl font-semibold text-green-600"
  } else if (count >= 350) {
    return "text-3xl font-semibold text-teal-600"
  } else if (count >= 200) {
    return "text-2xl font-medium text-purple-600"
  } else if (count >= 150) {
    return "text-2xl font-medium text-pink-600"
  } else if (count >= 100) {
    return "text-xl font-medium text-rose-600"
  } else if (count >= 75) {
    return "text-xl font-medium text-orange-600"
  } else if (count >= 50) {
    return "text-lg font-normal text-indigo-600"
  } else if (count >= 35) {
    return "text-lg font-normal text-cyan-600"
  } else if (count >= 20) {
    return "text-base font-normal text-teal-600"
  } else if (count >= 10) {
    return "text-base font-normal text-gray-600"
  } else {
    return "text-sm font-normal text-gray-500"
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

definePageMeta({
  layout: "minimal",
  middleware: ["auth"]
})
</script>

<style scoped>
.floating-emoji {
  position: absolute;
  pointer-events: none;
  user-select: none;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

@keyframes float-delayed {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(-5deg);
  }
}

@keyframes drift {
  0% {
    transform: translateX(0px) translateY(0px);
  }
  25% {
    transform: translateX(10px) translateY(-10px);
  }
  50% {
    transform: translateX(0px) translateY(-20px);
  }
  75% {
    transform: translateX(-10px) translateY(-10px);
  }
  100% {
    transform: translateX(0px) translateY(0px);
  }
}

.transition-words {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 0.7;
    transform: translateY(0);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}
</style>

<style>
body {
  background-image: radial-gradient(circle at top left, rgba(147, 197, 253, 0.1), transparent 30%),
  radial-gradient(circle at bottom right, rgba(244, 114, 182, 0.1), transparent 30%);
  background-attachment: fixed;
}
</style>
