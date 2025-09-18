<template>
  <div class="flex flex-col gap-2">
    <pub-select v-model:value="publisher" />
    <v-textarea
      v-model="content"
      placeholder="What's happended?!"
      @keydown.meta.enter.exact="submit"
      @keydown.ctrl.enter.exact="submit"
    />
    <div v-if="fileList.length > 0" class="d-flex gap-2 flex-wrap">
      <v-img
        v-for="file in fileList"
        :key="file.name"
        :src="file.url"
        width="100"
        height="100"
        class="rounded"
      />
    </div>
    <div class="flex justify-between">
      <div class="flex gap-2">
        <v-file-input
          v-model="selectedFiles"
          multiple
          accept="image/*,video/*,audio/*"
          label="Upload files"
          prepend-icon="mdi-upload"
          hide-details
          density="compact"
          @change="handleFileSelect"
        />
      </div>
      <v-btn type="primary" :loading="submitting" @click="submit">
        Post
        <template #append>
          <v-icon>mdi-send</v-icon>
        </template>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as tus from 'tus-js-client'
import { useSolarNetwork } from '~/composables/useSolarNetwork'

import PubSelect from './PubSelect.vue'

// Interface for uploaded files in the editor
interface UploadedFile {
  name: string
  url: string
  type: string
}

const emits = defineEmits(['posted'])

const publisher = ref<string | undefined>()
const content = ref('')

const selectedFiles = ref<File[]>([])
const fileList = ref<UploadedFile[]>([])

const submitting = ref(false)

async function submit() {
  submitting.value = true
  const api = useSolarNetwork()
  await api(`/posts?pub=${publisher.value}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      content: content.value,
      attachments: fileList.value
        .filter((e) => e.url != null)
        .map((e) => e.url!.split('/').reverse()[0]),
    }),
  })

  submitting.value = false
  content.value = ''
  fileList.value = []
  emits('posted')
}

function handleFileSelect() {
  selectedFiles.value.forEach(file => {
    uploadFile(file)
  })
  selectedFiles.value = []
}

function uploadFile(file: File) {
  const upload = new tus.Upload(file, {
    endpoint: '/cgi/drive/tus',
    retryDelays: [0, 3000, 5000, 10000, 20000],
    removeFingerprintOnSuccess: false,
    uploadDataDuringCreation: false,
    metadata: {
      filename: file.name,
      'content-type': file.type ?? 'application/octet-stream',
    },
    headers: {
      'X-DirectUpload': 'true',
    },
    onShouldRetry: () => false,
    onError: function (error) {
      console.error('[DRIVE] Upload failed:', error)
    },
    onProgress: function (_bytesUploaded, _bytesTotal) {
      // Could show progress
    },
    onSuccess: function (payload) {
      const rawInfo = payload.lastResponse.getHeader('x-fileinfo')
      const jsonInfo = JSON.parse(rawInfo as string)
      console.log('[DRIVE] Upload successful: ', jsonInfo)
      fileList.value.push({
        name: file.name,
        url: `/cgi/drive/files/${jsonInfo.id}`,
        type: jsonInfo.mime_type,
      })
    },
    onBeforeRequest: function (req) {
      const xhr = req.getUnderlyingObject()
      xhr.withCredentials = true
    },
  })
  upload.findPreviousUploads().then(function (previousUploads) {
    if (previousUploads.length > 0 && previousUploads[0]) {
      upload.resumeFromPreviousUpload(previousUploads[0])
    }
    upload.start()
  })
}
</script>
