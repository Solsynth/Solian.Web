import { useUserStore } from "~/stores/user"

export default defineNuxtPlugin(() => {
  const side = import.meta.server ? "SERVER" : "CLIENT"
  console.log(`[AUTH PLUGIN] Running on ${side}`)
  const userStore = useUserStore()

  // Fix hydration mismatch: if isLoading is true on client, it's likely a stale state
  // from SSR where the fetch didn't complete before the response was sent.
  // Reset it to allow the client to fetch properly.
  if (import.meta.client && userStore.isLoading) {
    console.log(
      `[AUTH PLUGIN] Detected stale isLoading state on ${side}. Resetting to allow fetch.`
    )
    userStore.isLoading = false
  }

  // Prevent fetching if it's already in progress (server-side only now)
  if (userStore.isLoading) {
    console.log(
      `[AUTH PLUGIN] User fetch already in progress on ${side}. Skipping.`
    )
    return
  }

  // On initial app load, fetch the user if a token exists but the user object isn't populated.
  if (!userStore.user) {
    console.log(
      `[AUTH PLUGIN] User not loaded. Trying to fetching user on ${side}.`
    )
    userStore.fetchUser()
  }
})
