<template>
  <div class="d-flex flex-wrap gap-2">
    <!-- Add Reaction Button -->
    <v-chip
      v-if="canReact"
      rounded
      :disabled="submitting"
      prepend-icon="mdi-plus"
      @click="showReactionDialog"
    >
      React
    </v-chip>

    <!-- Existing Reactions -->
    <v-chip
      v-for="(count, symbol) in reactions"
      :key="symbol"
      rounded
      :color="getReactionColor(symbol)"
      :disabled="submitting"
      @click="reactToPost(symbol)"
    >
      <span class="reaction-emoji">{{ getReactionEmoji(symbol) }}</span>
      <span class="reaction-symbol">{{ symbol }}</span>
      <v-chip size="x-small" variant="flat" class="reaction-count ms-1">
        {{ count }}
      </v-chip>
    </v-chip>
  </div>

  <!-- Reaction Selection Dialog -->
  <v-dialog v-model="reactionDialog" max-width="500" height="600">
    <v-card prepend-icon="mdi-emoticon-outline" title="React Post">
      <!-- Dialog Content -->
      <div class="dialog-content">
        <!-- Positive Reactions -->
        <div class="reaction-section">
          <div class="section-header d-flex align-center px-6 py-3">
            <v-icon class="me-2">mdi-emoticon-happy</v-icon>
            <span class="font-bold">Positive</span>
          </div>
          <div class="reaction-grid">
            <v-card
              v-for="reaction in getReactionsByAttitude(0)"
              :key="reaction.symbol"
              class="reaction-card mx-2"
              :class="{ selected: isReactionMade(reaction.symbol) }"
              :disabled="submitting"
              @click="selectReaction(reaction.symbol)"
            >
              <div class="d-flex flex-column align-center justify-center pa-3">
                <span class="text-h4 mb-1">{{ reaction.emoji }}</span>
                <span class="text-xs text-center mb-1">{{
                  reaction.symbol
                }}</span>
                <span
                  v-if="getReactionCount(reaction.symbol) > 0"
                  class="text-xs"
                >
                  x{{ getReactionCount(reaction.symbol) }}
                </span>
                <div v-else class="spacer"></div>
              </div>
            </v-card>
          </div>
        </div>

        <!-- Neutral Reactions -->
        <div class="reaction-section">
          <div class="section-header d-flex align-center px-6 py-3">
            <v-icon class="me-2">mdi-emoticon-neutral</v-icon>
            <span class="font-bold">Neutral</span>
          </div>
          <div class="reaction-grid">
            <v-card
              v-for="reaction in getReactionsByAttitude(1)"
              :key="reaction.symbol"
              class="reaction-card mx-2"
              :class="{ selected: isReactionMade(reaction.symbol) }"
              :disabled="submitting"
              @click="selectReaction(reaction.symbol)"
            >
              <div class="d-flex flex-column align-center justify-center pa-3">
                <span class="text-h4 mb-1">{{ reaction.emoji }}</span>
                <span class="text-xs text-center mb-1">{{
                  reaction.symbol
                }}</span>
                <span
                  v-if="getReactionCount(reaction.symbol) > 0"
                  class="text-xs"
                >
                  x{{ getReactionCount(reaction.symbol) }}
                </span>
                <div v-else class="spacer"></div>
              </div>
            </v-card>
          </div>
        </div>

        <!-- Negative Reactions -->
        <div class="reaction-section">
          <div class="section-header d-flex align-center px-6 py-3">
            <v-icon class="me-2">mdi-emoticon-sad</v-icon>
            <span class="font-bold">Negative</span>
          </div>
          <div class="reaction-grid">
            <v-card
              v-for="reaction in getReactionsByAttitude(2)"
              :key="reaction.symbol"
              class="reaction-card mx-2"
              :class="{ selected: isReactionMade(reaction.symbol) }"
              :disabled="submitting"
              @click="selectReaction(reaction.symbol)"
            >
              <div class="d-flex flex-column align-center justify-center pa-3">
                <span class="text-h4 mb-1">{{ reaction.emoji }}</span>
                <span class="text-xs text-center mb-1">{{
                  reaction.symbol
                }}</span>
                <span
                  v-if="getReactionCount(reaction.symbol) > 0"
                  class="text-xs"
                >
                  x{{ getReactionCount(reaction.symbol) }}
                </span>
                <div v-else class="spacer"></div>
              </div>
            </v-card>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue"

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

function getReactionColor(symbol: string): string {
  const attitude =
    availableReactions.find((r) => r.symbol === symbol)?.attitude || 1
  if (attitude === 0) return "success"
  if (attitude === 2) return "error"
  return "primary"
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

<style scoped>
.reaction-emoji {
  font-size: 16px;
  margin-right: 4px;
}

.reaction-symbol {
  font-size: 12px;
  font-weight: 500;
}

.reaction-count {
  font-size: 10px;
  padding: 0 4px;
}

.reaction-section {
  margin-bottom: 16px;
}

.section-header {
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

.reaction-grid {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding: 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.reaction-grid::-webkit-scrollbar {
  display: none;
}

.reaction-card {
  min-width: 80px;
  height: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.reaction-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.reaction-card.selected {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-primary-container));
}

.spacer {
  height: 16px;
}
</style>
