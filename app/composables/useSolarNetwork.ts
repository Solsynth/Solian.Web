// Solar Network aka the api client
import { keysToCamel, keysToSnake } from "~/utils/transformKeys"

export const useSolarNetwork = () => {
  const apiBase = useSolarNetworkUrl()

  // Forward cookies from the incoming request
  const headers: HeadersInit = import.meta.server ? useRequestHeaders() : {}

  return $fetch.create({
    baseURL: apiBase,
    credentials: "include",
    headers,
    // Add Authorization header with Bearer token
    onRequest: ({ request, options }) => {
      const side = import.meta.server ? "SERVER" : "CLIENT"
      console.log(`[useSolarNetwork] onRequest for ${request} on ${side}`)

      // Transform request data from camelCase to snake_case
      if (options.body && typeof options.body === "object") {
        options.body = keysToSnake(options.body)
      }
    },
    // Transform response keys from snake_case to camelCase
    onResponse: ({ response }) => {
      const encoding = response.headers.get("content-encoding")
      if (encoding) {
        console.log("[useSolarNetwork] Response encoding: ", encoding)
      }
      // Then transform keys if applicable
      if (response._data) {
        response._data = keysToCamel(response._data)
      }
    }
  })
}

export const useSolarNetworkUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiBase
}
