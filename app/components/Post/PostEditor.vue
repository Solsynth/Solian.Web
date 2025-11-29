<template>
  <div class="flex flex-col gap-3">
    <pub-select v-model:value="publisher" />
    <n-input
      v-model:value="content"
      type="textarea"
      placeholder="What's happended?!"
      @keydown.meta.enter.exact="submit"
      @keydown.ctrl.enter.exact="submit"
    />
    <div class="flex justify-end">
      <n-button type="primary" :loading="submitting" @click="submit">
        Post
        <template #icon>
          <n-icon :component="SendIcon" />
        </template>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SendIcon } from "lucide-vue-next"
import { ref } from "vue"
import { useSolarNetwork } from "~/composables/useSolarNetwork"

// Interface for uploaded files in the editor
interface UploadedFile {
  name: string
  url: string
  type: string
}

const emits = defineEmits(["posted"])

const publisher = ref<string | undefined>()
const content = ref("")

const fileList = ref<UploadedFile[]>([])

const submitting = ref(false)

async function submit() {
  submitting.value = true
  const api = useSolarNetwork()
  await api(`/sphere/posts?pub=${publisher.value}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      content: content.value,
      attachments: fileList.value
        .filter((e) => e.url != null)
        .map((e) => e.url!.split("/").reverse()[0])
    })
  })

  submitting.value = false
  content.value = ""
  fileList.value = []
  emits("posted")
}
</script>
