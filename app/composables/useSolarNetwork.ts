// Solar Network aka the api client
import { keysToCamel, keysToSnake } from "~/utils/transformKeys"

export const useSolarNetwork = () => {
  const apiBase = useSolarNetworkUrl()

  return $fetch.create({
    baseURL: apiBase,
    credentials: "include",
    // Add Authorization header with Bearer token
    onRequest: ({ options }) => {
      // Get token from user store
      const userStore = useUserStore()
      const token = userStore.token

      if (token) {
        if (!options.headers) {
          options.headers = new Headers()
        }
        if (options.headers instanceof Headers) {
          options.headers.set("Authorization", `Bearer ${token}`)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(options.headers as any)["Authorization"] = `Bearer ${token}`
        }
      }

      // Transform request data from camelCase to snake_case
      if (options.body && typeof options.body === "object") {
        options.body = keysToSnake(options.body)
      }
    },
    // Transform response keys from snake_case to camelCase
    onResponse: ({ response }) => {
      if (response._data) {
        response._data = keysToCamel(response._data)
      }
    }
  })
}

export const useSolarNetworkUrl = () => {
  const config = useRuntimeConfig()
  return config.public.development ? "/api" : config.public.apiBase
}
