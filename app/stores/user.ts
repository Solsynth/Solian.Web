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
    if (isLoading.value) return
    if (!reload && user.value) return // Skip fetching if already loaded and not forced to

    isLoading.value = true
    error.value = null
    const api = useSolarNetwork()
    try {
      const response = await api("/id/accounts/me")

      user.value = response as SnAccount
      console.log(`[UserStore] Logged in as ${user.value.name}`)
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
