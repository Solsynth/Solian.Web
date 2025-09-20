<template>
  <div v-if="itemType == 'image'" class="relative rounded-md overflow-hidden" :style="containerStyle">
    <!-- Blurhash placeholder -->
    <div
      v-if="blurhash"
      class="absolute inset-0"
      :style="blurhashContainerStyle"
    >
      <canvas
        ref="blurCanvas"
        class="absolute top-0 left-0 w-full h-full"
        width="32"
        height="32"
      />
    </div>
    <!-- Main image -->
    <img
      :src="remoteSource"
      class="w-full h-auto rounded-md"
      :class="{ 'opacity-0': !imageLoaded && blurhash }"
      @load="imageLoaded = true"
      @error="imageLoaded = true"
    />
  </div>
  <audio v-else-if="itemType == 'audio'" :src="remoteSource" controls />
  <video v-else-if="itemType == 'video'" :src="remoteSource" controls />
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, watch } from "vue"
import { decode } from "blurhash"
import type { SnAttachment } from "~/types/api"

const props = defineProps<{ item: SnAttachment }>()

const itemType = computed(() => props.item.mimeType.split("/")[0] ?? "unknown")
const blurhash = computed(() => props.item.fileMeta?.blur)
const imageWidth = computed(() => props.item.fileMeta?.width)
const imageHeight = computed(() => props.item.fileMeta?.height)
const aspectRatio = computed(() => props.item.fileMeta?.ratio ?? (imageWidth.value && imageHeight.value ? imageHeight.value / imageWidth.value : 1))
const imageLoaded = ref(false)

const blurCanvas = ref<HTMLCanvasElement | null>(null)

const apiBase = useSolarNetworkUrl()
const remoteSource = computed(
  () => `${apiBase}/drive/files/${props.item.id}?original=true`
)

const containerStyle = computed(() => {
  if (imageWidth.value && imageHeight.value) {
    const maxWidth = 640 // Cap maximum width
    const maxHeight = 800 // Cap maximum height

    let width = imageWidth.value
    let height = imageHeight.value

    // Scale down if width exceeds max
    if (width > maxWidth) {
      const ratio = maxWidth / width
      width = maxWidth
      height = height * ratio
    }

    // Scale down if height exceeds max
    if (height > maxHeight) {
      const ratio = maxHeight / height
      height = maxHeight
      width = width * ratio
    }

    return {
      width: `${width}px`,
      height: `${height}px`,
      'max-width': '100%',
      'max-height': '100%'
    }
  }
  return {
    'max-width': '800px',
    'max-height': '600px'
  }
})

const blurhashContainerStyle = computed(() => {
  return {
    'padding-bottom': `${aspectRatio.value * 100}%`
  }
})

const decodeBlurhash = () => {
  if (!blurhash.value || !blurCanvas.value) return

  try {
    const pixels = decode(blurhash.value, 32, 32)
    const imageData = new ImageData(new Uint8ClampedArray(pixels), 32, 32)
    const context = blurCanvas.value.getContext("2d")
    if (context) {
      context.putImageData(imageData, 0, 0)
    }
  } catch (error) {
    console.warn("Failed to decode blurhash:", error)
  }
}

onMounted(() => {
  decodeBlurhash()

  // Fallback timeout to show image if load event doesn't fire
  if (blurhash.value) {
    setTimeout(() => {
      if (!imageLoaded.value) {
        imageLoaded.value = true
      }
    }, 3000) // 3 second timeout
  }
})

watch(blurhash, () => {
  decodeBlurhash()
})
</script>
