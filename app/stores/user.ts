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
  const currentFetchPromise = ref<Promise<void> | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  async function fetchUser(reload = true): Promise<void> {
    if (currentFetchPromise.value) {
      console.log(
        "[UserStore] Fetch already in progress. Waiting for existing fetch."
      )
      return currentFetchPromise.value
    }
    if (!reload && user.value) {
      console.log(
        `[UserStore] User store was loaded with account @${user.value.name} and no reload. Skipping.`
      )
      return Promise.resolve()
    }

    const fetchPromise = (async () => {
      isLoading.value = true
      error.value = null
      const api = useSolarNetwork()
      try {
        const response = await api<SnAccount>("/id/accounts/me")
        user.value = response
        console.log(`[UserStore] Logged in as @${user.value.name}`)
      } catch (e: unknown) {
        // Check for 401 Unauthorized error
        const is401Error =
          (e instanceof FetchError && e.statusCode === 401) ||
          (e &&
            typeof e === "object" &&
            "status" in e &&
            (e as { status: number }).status === 401) ||
          (e &&
            typeof e === "object" &&
            "statusCode" in e &&
            (e as { statusCode: number }).statusCode === 401) ||
          (e instanceof Error &&
            (e.message?.includes("401") || e.message?.includes("Unauthorized")))

        if (is401Error) {
          error.value = "Unauthorized"
          user.value = null
        } else {
          error.value = e instanceof Error ? e.message : "An error occurred"
          user.value = null // Clear user data on error
          console.error("Failed to fetch user... ", e)
        }

        console.log(`[UserStore] Logged as @${user.value!.name}`)
      } finally {
        isLoading.value = false
        currentFetchPromise.value = null
      }
    })()

    currentFetchPromise.value = fetchPromise
    return fetchPromise
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
