import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/image",
    "@nuxt/eslint",
    "@pinia/nuxt",
    "@nuxtjs/i18n",
    "@nuxtjs/color-mode",
    "nuxt-og-image",
    "@bg-dev/nuxt-naiveui",
  ],
  css: [
    "~/assets/css/main.css",
  ],
  app: {
    pageTransition: { name: "page", mode: "out-in" },
    head: {
      titleTemplate: "%s - Solar Network",
      link: [{ rel: "icon", type: "image/png", href: "/favicon.png" }]
    }
  },
  components: [
    {
      path: "~/components",
      pathPrefix: false
    }
  ],
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || "https://solian.app",
    name: "Solar Network"
  },
  ogImage: {
    fonts: [
      "Noto+Sans+SC:400",
      "Noto+Sans+TC:400",
      "Noto+Sans+JP:400",
      "Nunito:400"
    ]
  },
  colorMode: {
    preference: "system",
    fallback: "light"
  },
  features: {
    inlineStyles: false
  },
  pinia: {
    storesDirs: ["./app/stores/**"]
  },
  i18n: {
    defaultLocale: "en"
  },
  image: {
    domains: ["api.solian.app"]
  },
  runtimeConfig: {
    public: {
      development: process.env.NODE_ENV == "development",
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "https://api.solian.app",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "https://solian.app"
    }
  },
  vite: {
    plugins: [
      tailwindcss(),
      AutoImport({
        imports: [
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar'
            ]
          }
        ]
      }),
      Components({
        resolvers: [NaiveUiResolver()],
      })
    ]
  },
})
