// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/image",
    "@nuxt/eslint",
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    "vuetify-nuxt-module",
    "@nuxtjs/i18n"
  ],
  features: {
    inlineStyles: false
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "https://api.solian.app"
    }
  },
  image: {
    domains: ["api.solian.app"]
  }
})
