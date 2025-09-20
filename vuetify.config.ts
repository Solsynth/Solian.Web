import { defineVuetifyConfiguration } from "vuetify-nuxt-module/custom-configuration"
import { md3 } from "vuetify/blueprints"

export default defineVuetifyConfiguration({
  blueprint: md3,
  icons: {
    defaultSet: "mdi"
  },
  theme: {
    defaultTheme: "system",
    themes: {
      light: {
        colors: {
          background: "#f0f4fa",
          surface: "#ffffff",
          primary: "#3f51b5",
          secondary: "#2196f3",
          accent: "#009688",
          error: "#f44336",
          warning: "#ffc107",
          info: "#03a9f4",
          success: "#4caf50"
        }
      },
      dark: {
        dark: true,
        colors: {
          background: "#1e1f20",
          surface: "#0e0e0e",
          primary: "#3f51b5",
          secondary: "#2196f3",
          accent: "#009688",
          error: "#f44336",
          warning: "#ffc107",
          info: "#03a9f4",
          success: "#4caf50"
        }
      }
    }
  },
  date: {
    adapter: "luxon"
  }
})
