// Solar Network aka the api client
import { keysToCamel, keysToSnake } from "~/utils/transformKeys"

export const useSolarNetwork = (withoutProxy = false) => {
  const apiBase = useSolarNetworkUrl(withoutProxy)
  const headers = process.server ? useRequestHeaders(["cookie"]) : {}

  return $fetch.create({
    baseURL: apiBase,
    credentials: "include",
    headers,
    // Add Authorization header with Bearer token
    onRequest: ({ request, options }) => {
      const side = process.server ? "SERVER" : "CLIENT"
      console.log(`[useSolarNetwork] onRequest for ${request} on ${side}`)

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
