declare module 'markdown-it-texmath' {
  interface TexMathOptions {
    engine?: any
    delimiters?: string
    katexOptions?: Record<string, any>
  }

  function texmath(options?: TexMathOptions): any
  export default texmath
}
