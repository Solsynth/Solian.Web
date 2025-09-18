<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <v-app-bar flat>
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

        <v-responsive max-width="160">
          <v-avatar class="me-4" color="grey-darken-1" size="32" />
        </v-responsive>
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

const { isDark } = useCustomTheme()

const links: NavLink[] = [
  {
    title: "Explore",
    href: "/",
    icon: "mdi-compass"
  }
]
</script>
