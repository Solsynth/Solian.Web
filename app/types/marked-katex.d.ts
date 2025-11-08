declare module "marked-katex" {
  interface Options {
    throwOnError?: boolean
    errorColor?: string
    displayMode?: boolean
    leqno?: boolean
    fleqn?: boolean
    macros?: Record<string, string>
    colorIsTextColor?: boolean
    strict?: boolean | "ignore" | "warn" | "error"
    trust?:
      | boolean
      | ((context: {
          command: string
          url: string
          protocol: string
        }) => boolean)
    output?: "html" | "mathml" | "htmlAndMathml"
  }

  function markedKatex(options?: Options): object

  export default markedKatex
}
