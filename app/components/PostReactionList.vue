<template>
  <v-chip-group class="d-flex flex-wrap gap-2">
    <!-- Add Reaction Button -->
    <v-chip
      v-if="canReact"
      color="primary"
      rounded
      :disabled="submitting"
      @click="showReactionDialog"
    >
      <v-icon start size="16">mdi-plus</v-icon>
      <span class="text-caption">React</span>
    </v-chip>

    <!-- Existing Reactions -->
    <v-chip
      v-for="(count, symbol) in reactions"
      rounded
      :key="symbol"
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
  </v-chip-group>

  <!-- Reaction Selection Dialog -->
  <v-dialog v-model="reactionDialog" max-width="500" height="600">
    <v-card prepend-icon="mdi-emoticon-outline" title="React Post">
      <!-- Dialog Content -->
      <div class="dialog-content">
        <!-- Positive Reactions -->
        <div class="reaction-section">
          <div class="section-header d-flex align-center px-6 py-3">
            <v-icon class="me-2">mdi-emoticon-happy</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Positive</span>
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
                <span class="text-caption text-center mb-1">{{
                  reaction.symbol
                }}</span>
                <span
                  v-if="getReactionCount(reaction.symbol) > 0"
                  class="text-caption font-weight-bold"
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
            <span class="text-subtitle-1 font-weight-bold">Neutral</span>
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
                <span class="text-caption text-center mb-1">{{
                  reaction.symbol
                }}</span>
                <span
                  v-if="getReactionCount(reaction.symbol) > 0"
                  class="text-caption font-weight-bold"
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
            <span class="text-subtitle-1 font-weight-bold">Negative</span>
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
                <span class="text-caption text-center mb-1">{{
                  reaction.symbol
                }}</span>
                <span
                  v-if="getReactionCount(reaction.symbol) > 0"
                  class="text-caption font-weight-bold"
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
import { ref, computed } from "vue"

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

function getReactionEmoji(symbol: string): string {
  const reaction = availableReactions.find((r) => r.symbol === symbol)
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
    const response = await api(`/sphere/posts/${props.parentId}/reactions`, {
      method: "POST",
      body: {
        symbol: symbol,
        attitude: reaction.attitude
      }
    })

    // Check if we're removing the reaction (204 status) or adding (200)
    // In Nuxt, we can check the response status through the fetch response
    const isRemoving =
      response && typeof response === "object" && "status" in response
        ? (response as any).status === 204
        : false
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

// Computed properties and helper functions
const totalReactionsCount = computed(() => {
  return Object.values(props.reactions || {}).reduce(
    (sum, count) => sum + count,
    0
  )
})

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
.post-reaction-list {
  min-height: 32px;
}

.reaction-chip {
  height: 28px !important;
  border-radius: 14px;
}

.reaction-emoji {
  font-size: 16px;
  margin-right: 4px;
}

.reaction-symbol {
  font-size: 12px;
  font-weight: 500;
}

.reaction-count {
  height: 16px !important;
  font-size: 10px;
  padding: 0 4px;
}

/* Dialog Styles */
.reaction-dialog {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  max-height: calc(600px - 80px);
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
