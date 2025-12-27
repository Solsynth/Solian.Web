<template>
  <div class="min-h-screen">
    <main>
      <slot />
    </main>

    <footer
      class="backdrop-blur-2xl flex items-center h-12 px-4 sticky bottom-0 border-t border-t-gray-100/50"
    >
      <div class="container mx-auto flex items-center justify-between">
        <nuxt-link to="/">
          <img
            :src="Icon"
            alt="Cloudy Lamb"
            height="24"
            width="24"
            class="mr-2"
          />
        </nuxt-link>
        <p class="text-sm">Solar Network</p>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import Icon from "~/assets/images/cloudy-lamb.png"
</script>
