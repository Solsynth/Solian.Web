<template>
  <div class="lightbox-container">
    <!-- Top Toolbar -->
    <v-app-bar
      v-if="fileInfo"
      class="top-toolbar"
      flat
      height="56"
      color="rgba(0,0,0,0.7)"
      dark
    >
      <v-container fluid>
        <v-row align="center" class="pa-2">
          <v-col cols="12" md="4">
            <div class="d-flex align-center gap-2">
              <v-icon>mdi-file</v-icon>
              <span>{{ fileInfo.name || "File" }}</span>
            </div>
          </v-col>
          <v-col cols="12" md="8">
            <div class="d-flex align-center justify-end gap-4">
              <span>{{ fileInfo.mimeType }} ({{ fileType }})</span>
              <span>{{ formatBytes(fileInfo.size) }}</span>
              <span>{{ new Date(fileInfo.createdAt).toLocaleString() }}</span>
              <v-btn icon size="small" density="compact" @click="handleDownload">
                <v-icon>mdi-download</v-icon>
              </v-btn>
              <v-btn icon size="small" density="compact" @click="infoDialog = true">
                <v-icon>mdi-information</v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-app-bar>

    <!-- Main Content - File Preview -->
    <div class="preview-container">
      <v-progress-circular
        v-if="!fileInfo && !error"
        indeterminate
        size="64"
        class="loading-spinner"
      ></v-progress-circular>
      <v-alert
        v-else-if="error"
        type="error"
        title="No file was found"
        :text="error"
        class="error-alert"
      ></v-alert>
      <div v-else class="preview-content">
        <div v-if="fileInfo?.isEncrypted" class="encrypted-notice">
          <v-alert type="info" title="Encrypted file" class="mb-4">
            The file has been encrypted. Preview not available. Please enter the
            password to download it.
          </v-alert>
        </div>
        <div v-else class="file-preview">
          <v-img
            v-if="fileType === 'image'"
            :src="fileSource"
            class="preview-image"
            contain
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
          <v-alert
            v-else
            type="warning"
            title="Preview Unavailable"
            text="How can you preview this file?"
            class="preview-unavailable"
          />
        </div>
      </div>
    </div>

    <!-- Password Dialog -->
    <v-dialog v-model="secretDialog" max-width="400">
      <v-card>
        <v-card-title>
          <v-icon left>mdi-lock</v-icon>
          Enter Password
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="dialogPassword"
            label="Password"
            type="password"
            variant="outlined"
            autofocus
            @keyup.enter="confirmDownload"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="secretDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmDownload">Download</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Technical Details Dialog -->
    <v-dialog v-model="infoDialog" max-width="640">
      <v-card title="File Information" prepend-icon="mdi-information">
        <v-card-text>
          <div class="mb-4">
            <b>FID</b> <span class="font-mono">#{{ fileInfo?.id }}</span>
          </div>
          <div class="mb-4">
            <strong>Metadata:</strong>
          </div>
          <v-card variant="outlined" class="pa-2">
            <pre
              class="overflow-x-auto text-body-2"
            ><code>{{ JSON.stringify(fileInfo?.fileMeta, null, 2) }}</code></pre>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="infoDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { computed, onMounted, ref } from "vue"

import { downloadAndDecryptFile } from "./secure"
import { formatBytes } from "./format"
import type { SnCloudFile } from "~/types/api/post"

const route = useRoute()

const error = ref<string | null>(null)

const fileId = route.params.id
const passcode = route.query.passcode as string | undefined

const progress = ref<number | undefined>(0)

const infoDialog = ref<boolean>(false)
const secretDialog = ref<boolean>(false)
const dialogPassword = ref<string>("")

// View transition state
const isTransitioning = ref<boolean>(false)
const transitionImage = ref<string>("")
const transitionStyle = ref<Record<string, string | number>>({})

const api = useSolarNetwork()

const fileInfo = ref<SnCloudFile | null>(null)

useHead({
  title: computed(() => fileInfo.value?.name ? `${fileInfo.value.name} - File Preview` : 'File Preview')
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
  const transitionData = sessionStorage.getItem('imageTransition')
  if (transitionData) {
    try {
      const data = JSON.parse(transitionData)
      isTransitioning.value = true
      transitionImage.value = data.src

      // Calculate final position (centered in viewport)
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const finalWidth = Math.min(viewportWidth * 0.9, data.width * (viewportHeight / data.height))
      const finalHeight = finalWidth / data.aspectRatio
      const finalX = (viewportWidth - finalWidth) / 2
      const finalY = (viewportHeight - finalHeight) / 2

      // Set initial position (from original image location)
      transitionStyle.value = {
        position: 'fixed',
        top: `${data.y}px`,
        left: `${data.x}px`,
        width: `${data.width}px`,
        height: `${data.height}px`,
        zIndex: 9999,
        transition: 'all 0.3s ease-out'
      }

      // Animate to final position
      requestAnimationFrame(() => {
        transitionStyle.value = {
          ...transitionStyle.value,
          top: `${finalY}px`,
          left: `${finalX}px`,
          width: `${finalWidth}px`,
          height: `${finalHeight}px`
        }

        // Hide transition after animation
        setTimeout(() => {
          isTransitioning.value = false
          sessionStorage.removeItem('imageTransition')
        }, 300)
      })
    } catch (error) {
      console.warn('Failed to parse transition data:', error)
      sessionStorage.removeItem('imageTransition')
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
const fileSource = computed(() => {
  let url = `${apiBase}/drive/files/${fileId}?original=true`
  if (passcode) {
    url += `?passcode=${passcode}`
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

async function performDownload(password: string) {
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
  }
}

definePageMeta({
  layout: "minimal"
})
</script>

<style scoped>
.lightbox-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.top-toolbar {
  position: relative;
  z-index: 1001;
  backdrop-filter: blur(10px);
}

.preview-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
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
  max-width: calc(100vw - 40px);
  max-height: calc(
    100vh - 88px
  ); /* Account for top toolbar (48px) + padding (40px) */
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-video,
.preview-audio {
  max-width: 100%;
  max-height: 100%;
}

.preview-unavailable {
  max-width: 500px;
}

.loading-spinner {
  color: white;
}

.error-alert {
  max-width: 500px;
}

.encrypted-notice {
  max-width: 500px;
}

/* Ensure toolbar doesn't interfere with content */
.top-toolbar :deep(.v-app-bar__content) {
  padding: 0;
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
