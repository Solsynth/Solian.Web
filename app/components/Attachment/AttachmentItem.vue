<template>
  <div class="relative rounded-md overflow-hidden" :style="containerStyle">
    <template v-if="itemType == 'image'">
      <!-- Blurhash placeholder -->
      <div
        v-if="blurhash"
        class="absolute inset-0 z-[-1]"
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
      <n-image
        :src="remoteSource"
        class="w-full h-auto rounded-md transition-opacity duration-500 object-cover cursor-pointer"
        :class="{ 'opacity-0': !imageLoaded && blurhash }"
        @load="imageLoaded = true"
        @error="imageLoaded = true"
      />
    </template>

    <audio
      v-else-if="itemType == 'audio'"
      class="w-full h-auto"
      :src="remoteSource"
      controls
    />
    <video
      v-else-if="itemType == 'video'"
      class="w-full h-auto"
      :src="remoteSource"
      controls
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, watch } from "vue"
import { decode } from "blurhash"
import type { SnAttachment } from "~/types/api"

const props = defineProps<{
  item: SnAttachment
  original?: boolean
  maxHeight?: string
}>()

const itemType = computed(() => props.item.mimeType.split("/")[0] ?? "unknown")
const blurhash = computed(() => props.item.fileMeta?.blur)
const imageWidth = computed(() => props.item.fileMeta?.width)
const imageHeight = computed(() => props.item.fileMeta?.height)
const aspectRatio = computed(
  () =>
    props.item.fileMeta?.ratio ??
    (imageWidth.value && imageHeight.value
      ? imageHeight.value / imageWidth.value
      : null)
)
const imageLoaded = ref(false)

const router = useRouter()

function openExternally() {
  // Capture image position for transition
  const img = event?.target as HTMLImageElement
  if (img && itemType.value === "image") {
    const rect = img.getBoundingClientRect()
    const transitionData = {
      src: remoteSource.value,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      aspectRatio: aspectRatio.value == null ? 0 : aspectRatio.value
    }

    // Store transition data
    sessionStorage.setItem("imageTransition", JSON.stringify(transitionData))
  }

  router.push("/files/" + props.item.id)
}

const blurCanvas = ref<HTMLCanvasElement | null>(null)

const apiBase = useSolarNetworkUrl()
const remoteSource = computed(
  () =>
    `${apiBase}/drive/files/${props.item.id}` +
    (props.original ? "?original=true" : "")
)

const blurhashContainerStyle = computed(() => {
  return {
    "padding-bottom": `${
      aspectRatio.value == null ? 0 : aspectRatio.value * 100
    }%`
  }
})

const containerStyle = computed(() => {
  return {
    "max-height": props.maxHeight ?? "720px",
    "aspect-ratio": aspectRatio.value
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
