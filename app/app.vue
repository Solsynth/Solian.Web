<template>
  <naive-config>
    <n-config-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-message-provider>
            <n-loading-bar-provider>
              <nuxt-loading-indicator :color="colorMode.value == 'dark' ? 'white' : '#3f51b5'" />
              <nuxt-layout>
                <nuxt-page />
              </nuxt-layout>
            </n-loading-bar-provider>
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-config-provider>
  </naive-config>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
</script>
