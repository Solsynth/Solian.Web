import { useDark, useToggle } from "@vueuse/core"

// composables/useCustomTheme.ts
export function useCustomTheme(): {
  isDark: WritableComputedRef<boolean, boolean>
  toggle: (value?: boolean | undefined) => boolean
} {
  const { $vuetify } = useNuxtApp()

  const isDark = useDark({
    valueDark: "dark",
    valueLight: "light",
    initialValue: "light",
    onChanged: (dark: boolean) => {
      $vuetify.theme.change(dark ? "dark" : "light")
    }
  })

  const toggle = useToggle(isDark)

  return { isDark, toggle }
}
