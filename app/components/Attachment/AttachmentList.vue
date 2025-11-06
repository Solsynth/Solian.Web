<template>
  <div v-if="attachments.length > 0" @click.stop>
    <!-- Single attachment: direct render -->
    <attachment-item
      v-if="attachments.length === 1 && attachments[0]"
      :item="attachments[0]"
    />

    <!-- Multiple attachments -->
    <template v-else>
      <!-- All images: use carousel -->
      <div
        v-if="isAllImages"
        class="carousel-container rounded-lg overflow-hidden"
        :style="carouselStyle"
      >
        <v-card width="100%" class="transition-all duration-300" border>
          <v-carousel
            height="100%"
            hide-delimiter-background
            show-arrows="hover"
            hide-delimiters
            progress="primary"
          >
            <v-carousel-item
              v-for="attachment in attachments"
              :key="attachment.id"
              cover
            >
              <attachment-item
                original
                :item="attachment"
              />
            </v-carousel-item>
          </v-carousel>
        </v-card>
      </div>

      <!-- Mixed content: vertical scrollable -->
      <div v-else class="space-y-4 max-h-96 overflow-y-auto">
        <attachment-item
          v-for="attachment in attachments"
          :key="attachment.id"
          :item="attachment"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue"
import type { SnAttachment } from "~/types/api"
import AttachmentItem from "./AttachmentItem.vue"

const props = defineProps<{
  attachments: SnAttachment[]
  maxHeight?: number
}>()

const apiBase = useSolarNetworkUrl()

const isAllImages = computed(
  () =>
    props.attachments.length > 0 &&
    props.attachments.every((att) => att.mimeType?.startsWith("image/"))
)

const carouselHeight = computed(() => {
  if (!isAllImages.value) return Math.min(400, props.maxHeight || 400)

  const aspectRatio = calculateAspectRatio()
  // Use a base width of 600px for calculation, adjust height accordingly
  const baseWidth = 600
  const calculatedHeight = Math.round(baseWidth / aspectRatio)

  // Respect maxHeight constraint if provided
  const constrainedHeight = props.maxHeight
    ? Math.min(calculatedHeight, props.maxHeight)
    : calculatedHeight

  return constrainedHeight
})

const carouselStyle = computed(() => {
  if (!isAllImages.value) return {}

  const aspectRatio = calculateAspectRatio()
  const height = carouselHeight.value
  const width = Math.round(height * aspectRatio)

  return {
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: "100%" // Ensure it doesn't overflow container
  }
})

function calculateAspectRatio(): number {
  const ratios: number[] = []

  // Collect all valid ratios
  for (const attachment of props.attachments) {
    const meta = attachment.fileMeta
    if (meta && typeof meta === "object" && "ratio" in meta) {
      const ratioValue = (meta as Record<string, unknown>).ratio
      if (typeof ratioValue === "number" && ratioValue > 0) {
        ratios.push(ratioValue)
      } else if (typeof ratioValue === "string") {
        try {
          const parsed = parseFloat(ratioValue)
          if (parsed > 0) ratios.push(parsed)
        } catch {
          // Skip invalid string ratios
        }
      }
    }
  }

  if (ratios.length === 0) {
    // Default to 4:3 aspect ratio when no valid ratios found
    return 4 / 3
  }

  if (ratios.length === 1 && ratios[0]) {
    return ratios[0]
  }

  // Group similar ratios and find the most common one
  const commonRatios: Record<number, number> = {}

  // Common aspect ratios to round to (with tolerance)
  const tolerance = 0.05
  const standardRatios = [
    1.0,
    4 / 3,
    3 / 2,
    16 / 9,
    5 / 3,
    5 / 4,
    7 / 5,
    9 / 16,
    2 / 3,
    3 / 4,
    4 / 5
  ]

  for (const ratio of ratios) {
    // Find the closest standard ratio within tolerance
    let closestRatio = ratio
    let minDiff = Infinity

    for (const standard of standardRatios) {
      const diff = Math.abs(ratio - standard)
      if (diff < minDiff && diff <= tolerance) {
        minDiff = diff
        closestRatio = standard
      }
    }

    // If no standard ratio is close enough, keep original
    if (minDiff === Infinity || minDiff > tolerance) {
      closestRatio = ratio
    }

    commonRatios[closestRatio] = (commonRatios[closestRatio] || 0) + 1
  }

  // Find the most frequent ratio(s)
  let maxCount = 0
  const mostFrequent: number[] = []

  for (const ratio of Object.keys(commonRatios)) {
    const ratioNum = parseFloat(ratio)
    const count = commonRatios[ratioNum] || 0
    if (count > maxCount) {
      maxCount = count
      mostFrequent.length = 0
      mostFrequent.push(ratioNum)
    } else if (count === maxCount) {
      mostFrequent.push(ratioNum)
    }
  }

  // If only one most frequent ratio, return it
  if (mostFrequent.length === 1 && mostFrequent[0]) {
    return mostFrequent[0]
  }

  // If multiple ratios have the same highest frequency, use median of them
  mostFrequent.sort((a, b) => a - b)
  const mid = Math.floor(mostFrequent.length / 2)
  return mostFrequent.length % 2 === 0
    ? (mostFrequent[mid - 1]! + mostFrequent[mid]!) / 2
    : mostFrequent[mid]!
}

function getAttachmentUrl(attachment: SnAttachment): string {
  return `${apiBase}/drive/files/${attachment.id}`
}
</script>
