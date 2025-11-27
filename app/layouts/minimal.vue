<template>
  <div class="min-h-screen">
    <main>
      <slot />
    </main>

    <nuxt-link to="/">
      <footer
        class="footer items-center h-12 px-4 bg-neutral text-neutral-content sticky bottom-0"
      >
        <div class="container mx-auto flex items-center">
          <img
            :src="Icon"
            alt="Cloudy Lamb"
            height="24"
            width="24"
            class="mr-2"
          />
          <p class="text-sm">Solar Network</p>
        </div>
      </footer>
    </nuxt-link>
  </div>
</template>

<script lang="ts" setup>
import Icon from "~/assets/images/cloudy-lamb.png"
</script>
