import type { PluginSimple } from "markdown-it"
import type katex from "katex"
import type { KatexOptions } from "katex"

declare module "markdown-it-texmath" {
  interface TexMathOptions {
    engine?: typeof katex
    delimiters?: string
    katexOptions?: KatexOptions
  }

  function texmath(options?: TexMathOptions): PluginSimple
  export default texmath
}
