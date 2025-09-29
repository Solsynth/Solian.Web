import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async to => {
  const userStore = useUserStore()

  // If the user is already authenticated, we're good.
  if (userStore.isAuthenticated) {
    return
  }

  // If we have a token, but no user object, fetch the user.
  // This happens on initial load or page refresh.
  if (userStore.token && !userStore.user) {
    await userStore.fetchUser()
  }

  // If the user is still not authenticated, redirect to login.
  if (!userStore.isAuthenticated) {
    // Abort navigation to the original page.
    if (to.path !== '/auth/login') {
      const redirect = encodeURIComponent(to.fullPath)
      console.log(`[AUTH] Redirecting to /auth/login?redirect=${redirect}`)
      return navigateTo(`/auth/login?redirect=${redirect}`)
    }
  }
})
