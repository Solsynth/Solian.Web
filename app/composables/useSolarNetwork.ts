// Solar Network aka the api client
import { keysToCamel, keysToSnake } from '~/utils/transformKeys'

export const useSolarNetwork = () => {
  const apiBase = useSolarNetworkUrl();

  return $fetch.create({
    baseURL: apiBase,
    credentials: 'include',
    // Transform response keys from snake_case to camelCase
    onResponse: ({ response }) => {
      if (response._data) {
        response._data = keysToCamel(response._data)
      }
    },
    // Transform request data from camelCase to snake_case
    onRequest: ({ options }) => {
      if (options.body && typeof options.body === 'object') {
        options.body = keysToSnake(options.body)
      }
    }
  })
}

export const useSolarNetworkUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiBase
}
