import tailwindcss from "@tailwindcss/vite"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/image",
    "@nuxt/eslint",
    "@pinia/nuxt",
    "vuetify-nuxt-module",
    "@nuxtjs/i18n"
  ],
  css: ["~/assets/css/main.css"],
  pinia: {
    storesDirs: ["./app/stores/**"]
  },
  features: {
    inlineStyles: false
  },
  image: {
    domains: ["api.solian.app"]
  },
  runtimeConfig: {
    public: {
      development: process.env.NODE_ENV == "development",
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "https://api.solian.app"
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  nitro: {
    devProxy: {
      "/api": {
        target: process.env.NUXT_PUBLIC_API_BASE || "https://api.solian.app",
        changeOrigin: true
      }
    }
  }
})
