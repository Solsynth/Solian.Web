<template>
  <naive-config>
    <n-global-style />
    <n-dialog-provider>
      <n-notification-provider>
        <naive-notification />
        <n-message-provider>
          <n-loading-bar-provider>
            <naive-loading-bar navigation />
            <nuxt-layout>
              <nuxt-page />
            </nuxt-layout>
          </n-loading-bar-provider>
        </n-message-provider>
      </n-notification-provider>
    </n-dialog-provider>
  </naive-config>
</template>

<script setup lang="ts">
import "@fontsource-variable/nunito"
</script>
