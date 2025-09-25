import { useUserStore } from '~/stores/user'

export default defineNuxtPlugin(() => {
  const side = process.server ? 'SERVER' : 'CLIENT'
  console.log(`[AUTH PLUGIN] Running on ${side}`)
  const userStore = useUserStore()

  // Prevent fetching if it's already in progress
  if (userStore.isLoading) {
    console.log(`[AUTH PLUGIN] User fetch already in progress on ${side}. Skipping.`)
    return
  }

  // On initial app load, fetch the user if a token exists but the user object isn't populated.
  if (userStore.token && !userStore.user) {
    console.log(`[AUTH PLUGIN] Token found, user not loaded. Fetching user on ${side}.`)
    userStore.fetchUser()
  } else {
    console.log(`[AUTH PLUGIN] Conditions not met for fetching user on ${side}.`, {
      hasToken: !!userStore.token,
      hasUser: !!userStore.user
    })
  }
})