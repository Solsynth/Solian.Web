import { createMarkdownExit } from "markdown-exit"
// @ts-ignore
import texmath from "markdown-it-texmath"
import katex from "katex"

export function useMarkdownProcessor() {
  const processor = createMarkdownExit({
    breaks: true,
    html: true,
    linkify: true,
    typographer: true
  // @ts-ignore
  }).use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { macros: { "\\RR": "\\mathbb{R}" } }
  })

  return {
    render: (content: string) => processor.render(content)
  }
}
