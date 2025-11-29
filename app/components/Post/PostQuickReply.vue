<template>
  <n-card title="Quick Reply" size="small" embedded>
    <div class="flex flex-col gap-2 mb-1">
      <pub-select v-model:value="publisher" />
      <n-input
        v-model:value="content"
        type="textarea"
        placeholder="Talk about this post for a bit."
        size="large"
        :rows="3"
        auto-grow
        @keydown.meta.enter.exact="submit"
        @keydown.ctrl.enter.exact="submit"
      >
        <template #suffix>
          <div class="flex items-end h-full py-3">
            <n-button text :loading="submitting" @click="submit">
              <template #icon>
                <n-icon :component="SendIcon" />
              </template>
            </n-button>
          </div>
        </template>
      </n-input>
    </div>
  </n-card>
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

const props = defineProps<{
  repliedPostId: string
}>()

const emits = defineEmits(["posted"])

const publisher = ref<string | undefined>()
const content = ref("")

const fileList = ref<UploadedFile[]>([])

const submitting = ref(false)

async function submit() {
  if (!content.value.trim()) return

  submitting.value = true
  const api = useSolarNetwork()
  await api(`/sphere/posts?pub=${publisher.value}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      content: content.value,
      replied_post_id: props.repliedPostId,
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
