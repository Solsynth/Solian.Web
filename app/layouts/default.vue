<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <v-app-bar flat class="app-bar-blur">
      <v-container class="mx-auto d-flex align-center justify-center">
        <v-btn
          v-for="link in links"
          :key="link.title"
          :text="link.title"
          :to="link.href"
          :prepend-icon="link.icon"
          variant="text"
        />

        <v-spacer />

        <v-avatar
          class="me-4"
          color="grey-darken-1"
          size="32"
          icon="mdi-account"
          :image="`${apiBase}/drive/files/${user?.profile.picture?.id}`"
        />
      </v-container>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { useCustomTheme } from "~/composables/useCustomTheme"
import type { NavLink } from "~/types/navlink"

const apiBase = useSolarNetworkUrl()

const { user } = useUserStore()
const { isDark } = useCustomTheme()

const links: NavLink[] = [
  {
    title: "Explore",
    href: "/",
    icon: "mdi-compass"
  }
]
</script>

<style scoped>
.app-bar-blur {
  -webkit-mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 40%,
    rgba(0, 0, 0, 0.5) 65%,
    rgba(0, 0, 0, 0) 100%
  );
  mask-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 40%,
    rgba(0, 0, 0, 0.5) 65%,
    rgba(0, 0, 0, 0) 100%
  );
  mask-repeat: no-repeat;
  mask-size: 100%;
}
</style>
