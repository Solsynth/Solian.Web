<template>
  <v-app :theme="colorMode.preference">
    <v-main>
      <slot />
    </v-main>

    <nuxt-link to="/">
      <v-footer app fixed flat height="48">
        <v-container class="mx-auto d-flex align-center justify-between">
          <img
            :src="Icon"
            alt="Cloudy Lamb"
            height="24"
            width="24"
            class="mr-2"
          />
          <p class="text-sm">Solar Network</p>
        </v-container>
      </v-footer>
    </nuxt-link>
  </v-app>
</template>

<script lang="ts" setup>
import Icon from "~/assets/images/cloudy-lamb.png"

const colorMode = useColorMode()
</script>
