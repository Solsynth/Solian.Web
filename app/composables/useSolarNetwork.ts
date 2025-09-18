// Solar Network aka the api client
export const useSolarNetwork = () => {
  const apiBase = useSolarNetworkUrl();
  return $fetch.create({ baseURL: apiBase, credentials: 'include' })
}

export const useSolarNetworkUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiBase
}