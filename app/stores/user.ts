import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import type { SnAccount } from "~/types/api"

export const useUserStore = defineStore("user", () => {
  // State
  const user = ref<SnAccount | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // The name is match with the remote one (set by server Set-Cookie)
  const token = useCookie<string | null>("AuthToken", {
    default: () => null,
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10
  }) // 10 years

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // Call fetchUser immediately
  fetchUser()

  // Actions
  async function fetchUser(reload = true) {
    if (!reload && user.value) return // Skip fetching if already loaded and not forced to

    isLoading.value = true
    error.value = null
    const api = useSolarNetwork()
    try {
      const response = await api("/id/accounts/me")

      user.value = response as SnAccount
      console.log(`Logged in as ${user.value.name}`)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "An error occurred"
      user.value = null // Clear user data on error
      console.error('Failed to fetch user... ', e)
    } finally {
      isLoading.value = false
    }
  }

  function setToken(newToken: string) {
    token.value = newToken
  }

  function logout() {
    user.value = null
    token.value = null
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    fetchUser,
    setToken,
    logout,
  }
})
