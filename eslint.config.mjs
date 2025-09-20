// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs"

import tailwind from "eslint-plugin-tailwindcss"

export default withNuxt(
  // Your custom configs here
  {
    ...tailwind.configs["flat/recommended"],
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "off",
      "vue/html-self-closing": "off"
    }
  }
)
