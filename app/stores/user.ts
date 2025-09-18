import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSolarNetwork } from '~/composables/useSolarNetwork'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<any>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  async function fetchUser(reload = true) {
    if (!reload && user.value) return // Skip fetching if already loaded and not forced to
    isLoading.value = true
    error.value = null
    const api = useSolarNetwork()
    try {
      const response = await api('/id/accounts/me')

      user.value = response
    } catch (e: any) {
      error.value = e.message
      user.value = null // Clear user data on error
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('authToken')
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    fetchUser,
    logout,
  }
})
