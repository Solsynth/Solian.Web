<template>
  <n-card title="Post your reply" size="small" embedded>
    <n-input
      type="textarea"
      placeholder="Talk about this post for a bit."
      size="large"
      :rows="5"
      auto-grow
    ></n-input>
    <div class="flex justify-end mt-4">
      <n-button append-icon="mdi-send" size="small">Send</n-button>
    </div>
  </n-card>
</template>
