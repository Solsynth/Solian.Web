// Solar Network aka the api client
import { keysToCamel, keysToSnake } from "~/utils/transformKeys"

export const useSolarNetwork = (withoutProxy = false) => {
  const apiBase = useSolarNetworkUrl(withoutProxy)

  return $fetch.create({
    baseURL: apiBase,
    credentials: "include",
    // Add Authorization header with Bearer token
    onRequest: ({ request, options }) => {
      const side = process.server ? "SERVER" : "CLIENT"
      console.log(`[useSolarNetwork] onRequest for ${request} on ${side}`)
      // Get token from user store
      const userStore = useUserStore()
      const token = userStore.token

      if (token) {
        console.log(
          "[useSolarNetwork] Token found, adding Authorization header."
        )
        if (!options.headers) {
          options.headers = new Headers()
        }
        if (options.headers instanceof Headers) {
          options.headers.set("Authorization", `Bearer ${token}`)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(options.headers as any)["Authorization"] = `Bearer ${token}`
        }
      } else {
        console.log(
          "[useSolarNetwork] No token found, skipping Authorization header."
        )
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

export const useSolarNetworkUrl = (withoutProxy = false) => {
  const config = useRuntimeConfig()
  return config.public.apiBase
}
