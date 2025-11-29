<template>
  <div v-if="mark" class="verification-card">
    <div class="flex items-start">
      <n-icon
        :component="verificationIcon"
        :size="32"
        :color="verificationColor"
        class="shrink-0"
      />
    </div>
    <div class="mt-2">
      <div class="font-bold text-base">{{ mark.title || "No title" }}</div>
      <div class="text-sm mt-1">{{ mark.description || "No description" }}</div>
      <div class="text-xs mt-1.5 opacity-80">
        Verified by<br />{{ mark.verifiedBy || "No one verified it" }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { SnVerification } from "~/types/api/publisher"
import {
  Wrench,
  BadgeCheck,
  ShieldCheck,
  Landmark,
  Palette,
  Code,
  Drama
} from "lucide-vue-next"

interface Props {
  mark: SnVerification
}

const props = defineProps<Props>()

// Icon mapping based on verification type
const verificationIcons = [
  Wrench, // 0: build_circle equivalent
  BadgeCheck, // 1: verified
  ShieldCheck, // 2: verified (alternative)
  Landmark, // 3: account_balance
  Palette, // 4: palette
  Code, // 5: code
  Drama // 6: masks
]

// Color mapping based on verification type
const verificationColors = [
  "#14b8a6", // teal
  "#03a9f4", // lightBlue
  "#3f51b5", // indigo
  "#f44336", // red
  "#ff9800", // orange
  "#2196f3", // blue
  "#448aff" // blueAccent
]

const verificationIcon = computed(() => {
  const type = props.mark.type
  return type >= 0 && type < verificationIcons.length
    ? verificationIcons[type]
    : BadgeCheck
})

const verificationColor = computed(() => {
  const type = props.mark.type
  return type >= 0 && type < verificationColors.length
    ? verificationColors[type]
    : "#2196f3"
})
</script>

<style scoped>
.verification-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
</style>
