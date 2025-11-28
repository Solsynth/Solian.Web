<template>
  <div class="flex flex-col min-h-screen">
    <header
      class="navbar bg-transparent shadow-lg fixed top-0 left-0 right-0 backdrop-blur-2xl z-1000 h-[64px]"
    >
      <div class="container mx-auto flex items-center">
        <img
          :src="IconLight"
          width="32"
          height="32"
          class="mr-4"
          alt="The Solar Network"
        />

        <n-menu
          v-model:value="activeKey"
          mode="horizontal"
          :options="menuOptions"
        />

        <div class="grow" />

        <n-dropdown :options="dropdownOptions" @select="handleDropdownSelect">
          <n-avatar
            round
            class="mr-4 cursor-pointer"
            :src="
              user?.profile.picture
                ? `${apiBase}/drive/files/${user?.profile.picture?.id}`
                : undefined
            "
          >
            <n-icon :component="UserCircleIcon" />
          </n-avatar>
        </n-dropdown>
      </div>
    </header>

    <main class="grow container mx-auto py-4 mt-[64px]">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
import IconLight from "~/assets/images/cloudy-lamb.png"

import type { MenuOption } from "naive-ui"
import { computed, h } from "vue"
import { useRouter, useRoute } from "vue-router"
import { CompassIcon, UserCircleIcon } from "lucide-vue-next"

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
  return () => h(NIcon, null, { default: () => icon })
}

const menuOptions: MenuOption[] = [
  {
    label: "Explore",
    key: "explore",
    icon: renderIcon(h(CompassIcon)),
    props: {
      onClick: () => router.push("/")
    }
  }
]

const dropdownOptions = computed(() => {
  if (user) {
    return [
      {
        label: "Dashboard",
        key: "/accounts/me",
        icon: () => h("span", { class: "mdi mdi-view-dashboard" })
      }
    ]
  } else {
    return [
      {
        label: "Login",
        key: "/auth/login",
        icon: () => h("span", { class: "mdi mdi-login" })
      },
      {
        label: "Create Account",
        key: "/auth/create-account",
        icon: () => h("span", { class: "mdi mdi-account-plus" })
      }
    ]
  }
})

function handleDropdownSelect(key: string) {
  router.push(key)
}
</script>
