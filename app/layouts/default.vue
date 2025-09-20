<template>
  <v-app :theme="colorMode.preference">
    <v-app-bar flat class="app-bar-blur">
      <v-container class="mx-auto d-flex align-center justify-center">
        <img
          :src="colorMode.value == 'dark' ? IconDark : IconLight"
          width="32"
          height="32"
          class="me-4"
          alt="The Solar Network"
        />

        <v-btn
          v-for="link in links"
          :key="link.title"
          :text="link.title"
          :to="link.href"
          :prepend-icon="link.icon"
          variant="text"
        />

        <v-spacer />

        <v-menu>
          <template v-slot:activator="{ props }">
            <v-avatar
              v-bind="props"
              class="me-4"
              color="grey-darken-1"
              size="32"
              icon="mdi-account-circle-outline"
              :image="
                user?.profile.picture
                  ? `${apiBase}/drive/files/${user?.profile.picture?.id}`
                  : undefined
              "
            />
          </template>
          <v-list density="compact">
            <v-list-item v-if="!user" to="/auth/login" prepend-icon="mdi-login"
              >Login</v-list-item
            >
            <v-list-item
              v-if="!user"
              to="/auth/create-account"
              prepend-icon="mdi-account-plus"
              >Create Account</v-list-item
            >
            <v-list-item
              v-if="user"
              to="/accounts/me"
              prepend-icon="mdi-view-dashboard"
              >Dashboard</v-list-item
            >
          </v-list>
        </v-menu>
      </v-container>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import IconLight from "~/assets/images/cloudy-lamb.png"
import IconDark from "~/assets/images/cloudy-lamb@dark.png"

import type { NavLink } from "~/types/navlink"

const apiBase = useSolarNetworkUrl()
const colorMode = useColorMode()

const { user } = useUserStore()

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
