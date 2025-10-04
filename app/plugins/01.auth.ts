import { useUserStore } from "~/stores/user"

export default defineNuxtPlugin(() => {
  const side = import.meta.server ? "SERVER" : "CLIENT"
  console.log(`[AUTH PLUGIN] Running on ${side}`)
  const userStore = useUserStore()

  // Prevent fetching if it's already in progress
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

