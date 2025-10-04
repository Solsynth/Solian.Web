import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import { FetchError } from "ofetch"
import type { SnAccount } from "~/types/api"

export const useUserStore = defineStore("user", () => {
  // State
  const user = ref<SnAccount | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  async function fetchUser(reload = true) {
    if (isLoading.value) {
      console.log("[UserStore] Fetch already in progress. Skipping.")
      return
    }
    if (!reload && user.value) {
      console.log(
        `[UserStore] User store was loaded with account @${user.value.name} and no reload. Skipping.`
      )
      return
    }

    isLoading.value = true
    error.value = null
    const api = useSolarNetwork()
    try {
      const response = await api<SnAccount>("/id/accounts/me")
      console.log("[UserStore] Fetched user data: ", response)
      user.value = response
      console.log(`[UserStore] Logged in as @${user.value.name}`)
    } catch (e: unknown) {
      if (e instanceof FetchError && e.statusCode == 401) {
        error.value = "Unauthorized"
        user.value = null
      } else {
        error.value = e instanceof Error ? e.message : "An error occurred"
        user.value = null // Clear user data on error
        console.error("Failed to fetch user... ", e)
      }
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    fetchUser,
    logout
  }
})
