<template>
  <div class="flex flex-wrap gap-3">
    <!-- Add Reaction Button -->
    <n-tag
      v-if="canReact"
      clickable
      style="cursor: pointer"
      type="primary"
      :disabled="submitting"
      @click="showReactionDialog"
    >
      <template #icon>
        <n-icon :component="HeartPlus" />
      </template>
      React
    </n-tag>

    <!-- Existing Reactions -->
    <n-space>
      <n-tag
        v-for="(count, symbol) in reactions"
        :key="symbol"
        :type="getReactionColor(symbol)"
        :disabled="submitting"
        @click="reactToPost(symbol)"
        style="cursor: pointer"
        class="reaction-tag"
      >
        <span class="reaction-emoji">{{ getReactionEmoji(symbol) }}</span>
        <span class="reaction-symbol ms-2">{{ symbol }}</span>
        <code class="text-xs ms-1.5">x{{ count }}</code>
      </n-tag>
    </n-space>
  </div>

  <!-- Reaction Selection Dialog -->
  <n-modal v-model:show="reactionDialog">
    <n-card class="max-w-[540px]">
      <template #header>
        <span class="font-bold">React Post</span>
      </template>
      <div class="dialog-content">
        <n-alert type="info" title="Reaction not available">
          Due to various of reasons, we stop providing the react creation on the
          FloatingIsland. To react post, head to web.solian.app
        </n-alert>
      </div>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Smile, Meh, Frown, HeartPlus } from "lucide-vue-next"

interface Props {
  parentId: string
  reactions?: Record<string, number>
  reactionsMade?: Record<string, boolean>
  canReact?: boolean
}

interface ReactionTemplate {
  symbol: string
  emoji: string
  attitude: number
}

const props = withDefaults(defineProps<Props>(), {
  reactions: () => ({}),
  reactionsMade: () => ({}),
  canReact: true
})

const emit = defineEmits<{
  react: [symbol: string, attitude: number, delta: number]
}>()

const submitting = ref(false)
const reactionDialog = ref(false)

// Available reaction templates
const availableReactions: ReactionTemplate[] = [
  { symbol: "thumb_up", emoji: "👍", attitude: 0 },
  { symbol: "thumb_down", emoji: "👎", attitude: 2 },
  { symbol: "just_okay", emoji: "😅", attitude: 1 },
  { symbol: "cry", emoji: "😭", attitude: 1 },
  { symbol: "confuse", emoji: "🧐", attitude: 1 },
  { symbol: "clap", emoji: "👏", attitude: 0 },
  { symbol: "laugh", emoji: "😂", attitude: 0 },
  { symbol: "angry", emoji: "😡", attitude: 2 },
  { symbol: "party", emoji: "🎉", attitude: 0 },
  { symbol: "pray", emoji: "🙏", attitude: 0 },
  { symbol: "heart", emoji: "❤️", attitude: 0 }
]

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function getReactionEmoji(symbol: string): string {
  let reaction = availableReactions.find((r) => r.symbol === symbol)
  if (reaction) return reaction.emoji

  // Try camelCase to snake_case conversion
  const snakeSymbol = camelToSnake(symbol)
  reaction = availableReactions.find((r) => r.symbol === snakeSymbol)
  return reaction?.emoji || "❓"
}

function getReactionColor(
  symbol: string
):
  | "success"
  | "error"
  | "primary"
  | "default"
  | "info"
  | "warning"
  | undefined {
  const attitude = availableReactions.find((r) => r.symbol === symbol)?.attitude
  if (attitude === 0) return "success"
  if (attitude === 2) return "error"
  // neutral or unspecified attitudes use default
  return "default"
}

async function reactToPost(symbol: string) {
  if (submitting.value) return

  const reaction = availableReactions.find((r) => r.symbol === symbol)
  if (!reaction) return

  try {
    submitting.value = true
    const api = useSolarNetwork()
    let statusCode = 200 // default status

    await api(`/sphere/posts/${props.parentId}/reactions`, {
      method: "POST",
      body: {
        symbol: symbol,
        attitude: reaction.attitude
      },
      onResponse: (res) => {
        statusCode = res.response.status
      }
    })

    // Check if we're removing the reaction (204 status) or adding (200)
    const isRemoving = statusCode === 204
    const delta = isRemoving ? -1 : 1

    emit("react", symbol, reaction.attitude, delta)
  } catch (error) {
    console.error("Failed to react to post:", error)
    // You might want to show a toast notification here
  } finally {
    submitting.value = false
  }
}

function showReactionDialog() {
  reactionDialog.value = true
}

function selectReaction(symbol: string) {
  reactionDialog.value = false
  reactToPost(symbol)
}

function getReactionsByAttitude(attitude: number): ReactionTemplate[] {
  return availableReactions.filter((reaction) => reaction.attitude === attitude)
}

function isReactionMade(symbol: string): boolean {
  return (props.reactionsMade || {})[symbol] || false
}

function getReactionCount(symbol: string): number {
  return (props.reactions || {})[symbol] || 0
}
</script>
