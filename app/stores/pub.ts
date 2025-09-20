import { defineStore } from "pinia"
import { ref } from "vue"
import { useSolarNetwork } from "~/composables/useSolarNetwork"
import type { SnPublisher } from "~/types/api"

export const usePubStore = defineStore("pub", () => {
  const publishers = ref<SnPublisher[]>([])

  async function fetchPublishers() {
    const api = useSolarNetwork()
    const resp = await api("/sphere/publishers")
    publishers.value = resp as SnPublisher[]
  }

  const userStore = useUserStore()

  watch(
    userStore,
    (value) => {
      if (value.isAuthenticated) fetchPublishers()
    },
    { deep: true, immediate: true }
  )

  return { publishers, fetchPublishers }
})
