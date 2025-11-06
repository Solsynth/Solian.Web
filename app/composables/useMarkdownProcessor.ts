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
    delimiters: "dollars",
    katexOptions: { macros: { "\\RR": "\\mathbb{R}" } }
  })

  const defaultParagraphRenderer =
    processor.renderer.rules.paragraph_open ||
    ((tokens, idx, options, env, self) =>
      self.renderToken(tokens, idx, options))
  processor.renderer.rules.paragraph_open = function (
    tokens,
    idx,
    options,
    env,
    self
  ) {
    let result = ""
    if (idx > 1) {
      const inline = tokens[idx - 2]
      const paragraph = tokens[idx]
      if (
        inline &&
        inline.type === "inline" &&
        inline.map &&
        inline.map[1] &&
        paragraph &&
        paragraph.map &&
        paragraph.map[0]
      ) {
        const diff = paragraph.map[0] - inline.map[1]
        if (diff > 0) {
          result = "<br>".repeat(diff)
        }
      }
    }
    return result + defaultParagraphRenderer(tokens, idx, options, env, self)
  }

  return {
    render: (content: string) => processor.render(content)
  }
}
