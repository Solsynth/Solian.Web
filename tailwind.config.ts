import type { Config } from "tailwindcss"

export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito Variable", "Helvatica", "sans-serif"]
      }
    }
  }
}
