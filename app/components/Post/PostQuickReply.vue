<template>
  <n-card title="Post your reply" size="small" embedded>
    <n-input
      type="textarea"
      placeholder="Talk about this post for a bit."
      size="large"
      :rows="5"
      auto-grow
    ></n-input>
    <div class="flex justify-end mt-3">
      <n-button type="primary">
        <template #icon>
          <n-icon :component="SendIcon" />
        </template>
        Send
      </n-button>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { SendIcon } from "lucide-vue-next"
</script>
