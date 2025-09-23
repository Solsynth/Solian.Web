<template>
  <div class="d-flex align-center justify-center fill-height">
    <v-card class="pa-6" max-width="1200" width="100%">
      <v-progress-circular
        v-if="!fileInfo && !error"
        indeterminate
        size="32"
      ></v-progress-circular>
      <v-alert
        type="error"
        title="No file was found"
        :text="error"
        v-else-if="error"
      ></v-alert>
      <div v-else>
        <v-row>
          <v-col cols="12" md="6">
            <div v-if="fileInfo.isEncrypted">
              <v-alert type="info" title="Encrypted file" class="mb-4">
                The file has been encrypted. Preview not available. Please enter
                the password to download it.
              </v-alert>
            </div>
            <div v-else>
              <v-img
                v-if="fileType === 'image'"
                :src="fileSource"
                class="w-full"
              />
              <video
                v-else-if="fileType === 'video'"
                :src="fileSource"
                controls
                class="w-full"
              />
              <audio
                v-else-if="fileType === 'audio'"
                :src="fileSource"
                controls
                class="w-full"
              />
              <v-alert
                type="warning"
                title="Preview Unavailable"
                text="How can you preview this file?"
                v-else
              />
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="mb-3">
              <v-card
                title="File Information"
                prepend-icon="mdi-information-outline"
                variant="tonal"
              >
                <v-card-text>
                  <div class="d-flex gap-2 mb-2">
                    <span class="flex-grow-1 d-flex align-center gap-2">
                      <v-icon size="18">mdi-information</v-icon>
                      File Type
                    </span>
                    <span>{{ fileInfo.mimeType }} ({{ fileType }})</span>
                  </div>
                  <div class="d-flex gap-2 mb-2">
                    <span class="flex-grow-1 d-flex align-center gap-2">
                      <v-icon size="18">mdi-chart-pie</v-icon>
                      File Size
                    </span>
                    <span>{{ formatBytes(fileInfo.size) }}</span>
                  </div>
                  <div class="d-flex gap-2 mb-2">
                    <span class="flex-grow-1 d-flex align-center gap-2">
                      <v-icon size="18">mdi-upload</v-icon>
                      Uploaded At
                    </span>
                    <span>{{
                      new Date(fileInfo.createdAt).toLocaleString()
                    }}</span>
                  </div>
                  <div class="d-flex gap-2 mb-2">
                    <span class="flex-grow-1 d-flex align-center gap-2">
                      <v-icon size="18">mdi-details</v-icon>
                      Technical Info
                    </span>
                    <v-btn
                      text
                      size="x-small"
                      @click="showTechDetails = !showTechDetails"
                    >
                      {{ showTechDetails ? "Hide" : "Show" }}
                    </v-btn>
                  </div>

                  <v-expand-transition>
                    <div
                      v-if="showTechDetails"
                      class="mt-2 d-flex flex-column gap-1"
                    >
                      <p class="text-caption opacity-75">#{{ fileInfo.id }}</p>

                      <v-card class="pa-2" variant="outlined">
                        <pre
                          class="overflow-x-auto px-2 py-1"
                        ><code>{{ JSON.stringify(fileInfo.fileMeta, null, 4) }}</code></pre>
                      </v-card>
                    </div>
                  </v-expand-transition>
                </v-card-text>
              </v-card>
            </div>

            <div class="d-flex flex-column gap-3">
              <v-text-field
                v-if="fileInfo.isEncrypted"
                label="Password"
                v-model="filePass"
                type="password"
              />
              <v-btn class="flex-grow-1" @click="downloadFile">Download</v-btn>
            </div>
            <v-expand-transition>
              <v-progress-linear
                v-if="!!progress"
                :model-value="progress"
                :indeterminate="progress < 100"
                class="mt-4"
              />
            </v-expand-transition>
          </v-col>
        </v-row>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router"
import { computed, onMounted, ref } from "vue"

import { downloadAndDecryptFile } from "./secure"
import { formatBytes } from "./format"

const route = useRoute()

const error = ref<string | null>(null)

const filePass = ref<string>("")
const fileId = route.params.id
const passcode = route.query.passcode as string | undefined

const progress = ref<number | undefined>(0)

const showTechDetails = ref<boolean>(false)

const api = useSolarNetwork()

const fileInfo = ref<any>(null)
async function fetchFileInfo() {
  try {
    let url = "/api/drive/files/" + fileId + "/info"
    if (passcode) {
      url += `?passcode=${passcode}`
    }
    const resp = await api(url)
    fileInfo.value = resp
  } catch (err) {
    error.value = (err as Error).message
  }
}
onMounted(() => fetchFileInfo())

const apiBase = useSolarNetworkUrl(false)

const fileType = computed(() => {
  if (!fileInfo.value) return "unknown"
  return fileInfo.value.mimeType?.split("/")[0] || "unknown"
})
const fileSource = computed(() => {
  let url = `${apiBase}/drive/files/${fileId}`
  if (passcode) {
    url += `?passcode=${passcode}`
  }
  return url
})

async function downloadFile() {
  if (fileInfo.value.isEncrypted && !filePass.value) {
    alert("Please enter the password to download the file.")
    return
  }
  if (fileInfo.value.isEncrypted) {
    downloadAndDecryptFile(
      fileSource.value,
      filePass.value,
      fileInfo.value.name,
      (p: number) => {
        progress.value = p * 100
      }
    ).catch((err: any) => {
      alert("Download failed: " + err.message)
      progress.value = undefined
    })
  } else {
    const res = await fetch(fileSource.value)
    if (!res.ok) {
      throw new Error(
        `Failed to download ${fileInfo.value.name}: ${res.statusText}`
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
      fileInfo.value.fileName ||
      "download." + fileInfo.value.mimeType.split("/")[1]
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(blobUrl)
  }
}
</script>
