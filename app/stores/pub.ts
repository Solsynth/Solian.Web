import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSolarNetwork } from '~/composables/useSolarNetwork'

export const usePubStore = defineStore('pub', () => {
  const publishers = ref<any[]>([])

  async function fetchPublishers() {
    const api = useSolarNetwork()
    const resp = await api('/publishers')
    publishers.value = resp as any[]
  }

  return { publishers, fetchPublishers }
})
