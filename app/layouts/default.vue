<template>
  <div class="flex flex-col min-h-screen">
    <header
      class="navbar bg-transparent shadow-lg fixed top-0 left-0 right-0 backdrop-blur-2xl z-1000 h-[64px]"
    >
      <div class="container mx-auto flex items-center justify-between px-5">
        <div class="flex gap-2">
          <div class="flex items-center justify-center w-[40px]">
            <img :src="IconLight" alt="The Solar Network" class="fit-cover" />
          </div>

          <n-menu
            v-model:value="activeKey"
            mode="horizontal"
            :options="menuOptions"
          />
        </div>

        <n-dropdown :options="dropdownOptions" @select="handleDropdownSelect">
          <n-avatar
            :size="32"
            :src="
              user?.profile.picture
                ? `${apiBase}/drive/files/${user?.profile.picture?.id}`
                : undefined
            "
          >
            <n-icon :component="UserIcon" :size="20" />
          </n-avatar>
        </n-dropdown>
      </div>
    </header>

    <main class="grow mt-[64px]">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
import IconLight from "~/assets/images/cloudy-lamb.png"

import type { MenuOption } from "naive-ui"
import { computed, h } from "vue"
import { useRouter, useRoute, RouterLink } from "vue-router"
import {
  CompassIcon,
  LayoutDashboardIcon,
  LogInIcon,
  UserIcon,
  UserPlusIcon
} from "lucide-vue-next"

const apiBase = useSolarNetworkUrl()
const router = useRouter()
const route = useRoute()

const { user } = useUserStore()

const activeKey = computed(() => {
  // Map route paths to menu keys
  if (route.path === "/") return "explore"
  return null
})

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function renderLabel(label: string, route: string) {
  return () => h(RouterLink, { to: route }, { default: () => label })
}

const menuOptions: MenuOption[] = [
  {
    label: renderLabel("Explore", "/"),
    key: "explore",
    icon: renderIcon(CompassIcon)
  }
]

const dropdownOptions = computed(() => {
  if (user) {
    return [
      {
        label: "Dashboard",
        key: "/accounts/me",
        icon: renderIcon(LayoutDashboardIcon)
      }
    ]
  } else {
    return [
      {
        label: "Login",
        key: "/auth/login",
        icon: renderIcon(LogInIcon)
      },
      {
        label: "Create Account",
        key: "/auth/create-account",
        icon: renderIcon(UserPlusIcon)
      }
    ]
  }
})

function handleDropdownSelect(key: string) {
  router.push(key)
}
</script>
