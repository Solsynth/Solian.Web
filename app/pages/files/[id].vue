<template>
  <div class="lightbox-container h-compact-layout">
    <!-- Top Toolbar -->
    <header v-if="fileInfo" class="top-toolbar bg-neutral-900/50 text-white">
      <div class="container mx-auto px-4 h-full">
        <div class="flex items-center h-full">
          <div class="flex items-center gap-2 w-full md:w-1/3">
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-icon :component="fileIcon" />
              </template>
              {{ fileInfo.mimeType }}
            </n-tooltip>
            <n-tooltip trigger="hover">
              <template #trigger>
                <span class="line-clamp-1">
                  {{ fileInfo.name || "File" }}
                </span>
              </template>
              {{ fileInfo.name || "File" }}
            </n-tooltip>
            <!-- Action buttons on mobile -->
            <div class="flex md:hidden gap-2 ml-auto">
              <n-button text style="font-size: 20px" @click="handleDownload">
                <n-icon :component="Download" />
              </n-button>
              <n-button text style="font-size: 20px" @click="infoDialog = true">
                <n-icon :component="Info" />
              </n-button>
            </div>
          </div>
          <div class="hidden md:flex items-center justify-end gap-4 w-2/3">
            <span>{{ formatBytes(fileInfo.size) }}</span>
            <span>{{ new Date(fileInfo.createdAt).toLocaleString() }}</span>
            <n-button text style="font-size: 20px" @click="handleDownload">
              <n-icon :component="Download" />
            </n-button>
            <n-button text style="font-size: 20px" @click="infoDialog = true">
              <n-icon :component="Info" />
            </n-button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content - File Preview -->
    <div class="preview-container">
      <n-spin v-if="!fileInfo && !error" size="large" />
      <n-alert
        v-else-if="error"
        type="error"
        title="No file was found"
        class="max-w-md"
      >
        {{ error }}
      </n-alert>
      <div v-else class="preview-content">
        <div v-if="fileInfo?.isEncrypted" class="max-w-md">
          <n-alert type="info" title="Encrypted file" class="mb-4">
            The file has been encrypted. Preview not available. Please enter the
            password to download it.
          </n-alert>
        </div>
        <div
          v-else
          class="file-preview"
          @wheel="handleZoom"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
          @dblclick="handleDoubleClick"
        >
          <img
            v-if="fileType === 'image'"
            :src="fileSource"
            class="preview-image"
            :style="{
              transform: `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`,
              cursor:
                zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }"
            alt="Image preview"
          />
          <video
            v-else-if="fileType === 'video'"
            :src="fileSource"
            controls
            class="preview-video"
          />
          <audio
            v-else-if="fileType === 'audio'"
            :src="fileSource"
            controls
            class="preview-audio"
          />
          <n-alert
            v-else
            type="warning"
            title="Preview Unavailable"
            class="max-w-md"
          >
            A preview for this file type is not available.
          </n-alert>
        </div>
      </div>
    </div>

    <!-- Password Dialog -->
    <n-modal v-model:show="secretDialog">
      <n-card
        style="width: 400px"
        title="Enter Password"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-input
          v-model:value="dialogPassword"
          type="password"
          show-password-on="click"
          placeholder="Password"
          autofocus
          @keyup.enter="confirmDownload"
        />
        <template #footer>
          <div class="flex justify-end gap-2">
            <n-button @click="secretDialog = false">Cancel</n-button>
            <n-button type="primary" @click="confirmDownload"
              >Download</n-button
            >
          </div>
        </template>
      </n-card>
    </n-modal>

    <!-- Technical Details Dialog -->
    <n-drawer
      v-model:show="infoDialog"
      :width="breakpoints.isGreaterOrEqual('md') ? '40vw' : '100vw'"
    >
      <n-drawer-content>
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <div>File Information</div>
            <n-button text size="small" @click="infoDialog = false">
              <template #icon>
                <n-icon :component="XIcon" />
              </template>
            </n-button>
          </div>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="flex flex-col gap-4">
            <div>
              <strong class="font-semibold">File ID</strong>
              <div class="opacity-80">#{{ fileInfo?.id }}</div>
            </div>
            <div>
              <strong class="font-semibold">File Name</strong>
              <div class="opacity-80">{{ fileInfo?.name || "N/A" }}</div>
            </div>
            <div>
              <strong class="font-semibold">MIME Type</strong>
              <div class="opacity-80">{{ fileInfo?.mimeType || "N/A" }}</div>
            </div>
            <div>
              <strong class="font-semibold">File Size</strong>
              <div class="opacity-80">
                {{ fileInfo?.size ? formatBytes(fileInfo.size) : "N/A" }}
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-4">
            <div>
              <strong class="font-semibold">Created At</strong>
              <div class="opacity-80">
                {{
                  fileInfo?.createdAt
                    ? new Date(fileInfo.createdAt).toLocaleString()
                    : "N/A"
                }}
              </div>
            </div>
            <div>
              <strong class="font-semibold">Encrypted</strong>
              <div class="opacity-80">
                {{ fileInfo?.isEncrypted ? "Yes" : "No" }}
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4">
          <strong class="font-semibold">Metadata:</strong>
        </div>
        <n-card :bordered="true" class="mt-2">
          <pre
            class="overflow-x-auto text-xs"
          ><code>{{ JSON.stringify(fileInfo?.fileMeta, null, 2) }}</code></pre>
        </n-card>
      </n-drawer-content>
    </n-drawer>

    <!-- View Transition Overlay -->
    <div
      v-if="isTransitioning"
      class="transition-overlay"
      :style="transitionStyle"
    >
      <img
        :src="transitionImage"
        class="transition-image"
        alt="Transitioning image"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router"
import { computed, onMounted, ref, type Component } from "vue"
import {
  Download,
  Info,
  Lock,
  File,
  FileImage,
  FileVideo,
  FileMusic,
  FileText,
  FileCode,
  FileArchive,
  XIcon
} from "lucide-vue-next"
import { downloadAndDecryptFile } from "./secure"
import { formatBytes } from "./format"
import type { SnCloudFile } from "~/types/api/post"
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core"

const route = useRoute()

const error = ref<string | null>(null)

const fileId = route.params.id
const passcode = route.query.passcode as string | undefined

const progress = ref<number | undefined>(0)

const infoDialog = ref<boolean>(false)
const secretDialog = ref<boolean>(false)
const dialogPassword = ref<string>("")

// Zoom functionality
const zoomLevel = ref<number>(1)
const initialDistance = ref<number>(0)
const isPinching = ref<boolean>(false)

// Drag functionality
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)

// View transition state
const isTransitioning = ref<boolean>(false)
const transitionImage = ref<string>("")
const transitionStyle = ref<Record<string, string | number>>({})

const api = useSolarNetwork()

const fileInfo = ref<SnCloudFile | null>(null)

useHead({
  title: computed(() =>
    fileInfo.value?.name
      ? `${fileInfo.value.name} - File Preview`
      : "File Preview"
  )
})
async function fetchFileInfo() {
  try {
    let url = "/drive/files/" + fileId + "/info"
    if (passcode) {
      url += `?passcode=${passcode}`
    }
    const resp = await api<SnCloudFile>(url)
    fileInfo.value = resp
  } catch (err) {
    error.value = (err as Error).message
  }
}

function checkForTransition() {
  const transitionData = sessionStorage.getItem("imageTransition")
  if (transitionData) {
    try {
      const data = JSON.parse(transitionData)
      isTransitioning.value = true
      transitionImage.value = data.src

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const finalWidth = Math.min(
        viewportWidth * 0.9,
        data.width * (viewportHeight / data.height)
      )
      const finalHeight = finalWidth / data.aspectRatio
      const finalX = (viewportWidth - finalWidth) / 2
      const finalY = (viewportHeight - finalHeight) / 2

      transitionStyle.value = {
        position: "fixed",
        top: `${data.y}px`,
        left: `${data.x}px`,
        width: `${data.width}px`,
        height: `${data.height}px`,
        zIndex: 9999,
        transition: "all 0.3s ease-out"
      }

      requestAnimationFrame(() => {
        transitionStyle.value = {
          ...transitionStyle.value,
          top: `${finalY}px`,
          left: `${finalX}px`,
          width: `${finalWidth}px`,
          height: `${finalHeight}px`
        }
        setTimeout(() => {
          isTransitioning.value = false
          sessionStorage.removeItem("imageTransition")
        }, 300)
      })
    } catch (error) {
      console.warn("Failed to parse transition data:", error)
      sessionStorage.removeItem("imageTransition")
    }
  }
}

onMounted(() => {
  fetchFileInfo()
  checkForTransition()
})

const apiBase = useSolarNetworkUrl()

const fileType = computed(() => {
  if (!fileInfo.value) return "unknown"
  return fileInfo.value.mimeType?.split("/")[0] || "unknown"
})
const fileIcon = computed<Component>(() => {
  if (!fileInfo.value?.mimeType) return File

  const mime = fileInfo.value.mimeType.toLowerCase()

  if (mime.startsWith("image/")) return FileImage
  if (mime.startsWith("video/")) return FileVideo
  if (mime.startsWith("audio/")) return FileMusic
  if (mime === "application/pdf") return FileText
  if (
    mime.startsWith("text/") ||
    mime.includes("javascript") ||
    mime.includes("json") ||
    mime.includes("xml")
  )
    return FileCode
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar"))
    return FileArchive
  if (
    mime.includes("document") ||
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("powerpoint")
  )
    return FileText

  return File
})
const fileSource = computed(() => {
  let url = `${apiBase}/drive/files/${fileId}?original=true`
  if (passcode) {
    url += `&passcode=${passcode}`
  }
  return url
})

function handleDownload() {
  if (fileInfo.value!.isEncrypted) {
    secretDialog.value = true
    dialogPassword.value = ""
  } else {
    performDownload("")
  }
}

async function confirmDownload() {
  if (!dialogPassword.value.trim()) {
    return
  }
  secretDialog.value = false
  await performDownload(dialogPassword.value)
}

function handleZoom(event: WheelEvent) {
  if (fileType.value !== "image") return

  event.preventDefault()
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.1, Math.min(5, zoomLevel.value + delta))

  if (newZoom <= 1) {
    translateX.value = 0
    translateY.value = 0
  }

  zoomLevel.value = newZoom
}

function handleTouchStart(event: TouchEvent) {
  if (fileType.value !== "image") return

  if (event.touches.length === 2) {
    event.preventDefault()
    isPinching.value = true
    const touch1 = event.touches[0]!
    const touch2 = event.touches[1]!
    initialDistance.value = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  } else if (event.touches.length === 1 && zoomLevel.value > 1) {
    isDragging.value = true
    startX.value = event.touches[0]!.clientX - translateX.value
    startY.value = event.touches[0]!.clientY - translateY.value
  }
}

function handleTouchMove(event: TouchEvent) {
  if (fileType.value !== "image") return

  if (isPinching.value && event.touches.length === 2) {
    event.preventDefault()
    const touch1 = event.touches[0]!
    const touch2 = event.touches[1]!
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    )

    const scale = currentDistance / initialDistance.value
    const newZoom = Math.max(0.1, Math.min(5, zoomLevel.value * scale))

    if (newZoom <= 1) {
      translateX.value = 0
      translateY.value = 0
    }

    zoomLevel.value = newZoom
  } else if (isDragging.value && event.touches.length === 1) {
    event.preventDefault()
    translateX.value = event.touches[0]!.clientX - startX.value
    translateY.value = event.touches[0]!.clientY - startY.value
  }
}

function handleTouchEnd(_event: TouchEvent) {
  if (fileType.value !== "image") return

  isPinching.value = false
  isDragging.value = false
}

function handleMouseDown(event: MouseEvent) {
  if (fileType.value !== "image" || zoomLevel.value <= 1) return

  event.preventDefault()
  isDragging.value = true
  startX.value = event.clientX - translateX.value
  startY.value = event.clientY - translateY.value
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return

  event.preventDefault()
  translateX.value = event.clientX - startX.value
  translateY.value = event.clientY - startY.value
}

function handleMouseUp() {
  isDragging.value = false
}

function handleDoubleClick() {
  if (fileType.value !== "image") return

  if (zoomLevel.value > 1) {
    zoomLevel.value = 1
    translateX.value = 0
    translateY.value = 0
  } else {
    zoomLevel.value = 2
  }
}

const breakpoints = useBreakpoints(breakpointsTailwind)
const message = useMessage()

async function performDownload(password: string) {
  const progressMessage = message.loading("Downloading file...", {
    duration: 0
  })

  if (fileInfo.value!.isEncrypted) {
    downloadAndDecryptFile(
      fileSource.value,
      password,
      fileInfo.value!.name,
      (p: number) => {
        progress.value = p * 100
      }
    ).catch((err: Error) => {
      alert("Download failed: " + err.message)
      progress.value = undefined
    })
  } else {
    const res = await fetch(fileSource.value)
    if (!res.ok) {
      throw new Error(
        `Failed to download ${fileInfo.value!.name}: ${res.statusText}`
      )
    }

    const contentLength = res.headers.get("content-length")
    if (!contentLength) {
      throw new Error("Content-Length response header is missing.")
    }

    const total = parseInt(contentLength, 10)
    const reader = res.body!.getReader()
    const chunks: Uint8Array[] = []
    let received = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        received += value.length
        progress.value = (received / total) * 100
      }
    }

    const blob = new Blob(chunks as BlobPart[])
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download =
      fileInfo.value!.name ||
      "download." + fileInfo.value!.mimeType.split("/")[1]
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(blobUrl)

    progressMessage.destroy()
    message.success("File has been downloaded successfully.")
  }
}

definePageMeta({
  layout: "minimal"
})
</script>

<style scoped>
.lightbox-container {
  width: 100vw;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.top-toolbar {
  height: 56px;
  position: relative;
  z-index: 1001;
}

.preview-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
  min-height: 0;
}

.preview-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.2s ease-out;
  will-change: transform;
}

.preview-video,
.preview-audio {
  max-width: 100%;
  max-height: 100%;
}

/* View transition styles */
.transition-overlay {
  pointer-events: none;
  z-index: 9999;
}

.transition-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}
</style>
