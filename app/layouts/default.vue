<template>
  <div class="flex flex-col min-h-screen" :data-theme="colorMode.preference">
    <header class="navbar bg-base-100 shadow-lg">
      <div class="container mx-auto flex items-center justify-center">
        <img :src="colorMode.value == 'dark' ? IconDark : IconLight" width="32" height="32" class="mr-4"
          alt="The Solar Network" />

        <n-button v-for="link in links" :key="link.title" text @click="() => router.push(link.href)">
          <template #icon>
            <span :class="`mdi ${link.icon}`"></span>
          </template>
          {{ link.title }}
        </n-button>

        <div class="grow" />

        <n-dropdown :options="dropdownOptions" @select="handleDropdownSelect">
          <n-avatar round class="mr-4 cursor-pointer" :size="32" :src="user?.profile.picture
            ? `${apiBase}/drive/files/${user?.profile.picture?.id}`
            : undefined
            ">
            <span v-if="!user" class="mdi mdi-account-circle text-3xl"></span>
          </n-avatar>
        </n-dropdown>
      </div>
    </header>

    <main class="grow container mx-auto py-4">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
import IconLight from "~/assets/images/cloudy-lamb.png"
import IconDark from "~/assets/images/cloudy-lamb@dark.png"

import type { NavLink } from "~/types/navlink"
import { computed, h } from "vue"
import { useRouter } from "vue-router"

const apiBase = useSolarNetworkUrl()
const colorMode = useColorMode()
const router = useRouter()

const { user } = useUserStore()

const links: NavLink[] = [
  {
    title: "Explore",
    href: "/",
    icon: "mdi-compass"
  }
]

const dropdownOptions = computed(() => {
  if (user) {
    return [
      {
        label: "Dashboard",
        key: "/accounts/me",
        icon: () => h('span', { class: 'mdi mdi-view-dashboard' })
      }
    ];
  } else {
    return [
      {
        label: "Login",
        key: "/auth/login",
        icon: () => h('span', { class: 'mdi mdi-login' })
      },
      {
        label: "Create Account",
        key: "/auth/create-account",
        icon: () => h('span', { class: 'mdi mdi-account-plus' })
      }
    ];
  }
});

function handleDropdownSelect(key: string) {
  router.push(key);
}
</script>
