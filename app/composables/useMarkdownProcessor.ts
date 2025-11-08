import { computed, unref, type Ref } from "vue"
import {
  createMarkdownExit,
  type PluginSimple,
  type PluginWithParams
} from "markdown-exit"
import hljs from "highlight.js"
import hljsMarkdown from "markdown-it-highlightjs"
// @ts-ignore
import texmath from "markdown-it-texmath"
import katex from "katex"

import "highlight.js/styles/a11y-dark.min.css"

export function useMarkdownProcessor(
  options: { preserveEmptyLines?: boolean | Ref<boolean> } = {
    preserveEmptyLines: true
  }
) {
  const serverUrl = useSolarNetworkUrl()

  const processor = computed(() => {
    const currentPreserveEmptyLines = unref(options.preserveEmptyLines)

    const md = createMarkdownExit({
      breaks: true,
      html: true,
      linkify: true,
      typographer: true
    })
      // @ts-ignore
      .use(texmath, {
        engine: katex,
        delimiters: "dollars",
        katexOptions: { macros: { "\\RR": "\\mathbb{R}" } }
      })
      .use(hljsMarkdown, { hljs })
      .use(imgSolarNetworkPlugin, { serverUrl: serverUrl })

    if (currentPreserveEmptyLines) {
      md.use(preserveEmptyLinesPlugin)
    }
    return md
  })

  return {
    render: (content: string) => processor.value.render(content)
  }
}

const preserveEmptyLinesPlugin: PluginSimple = (md) => {
  const defaultParagraphRenderer =
    md.renderer.rules.paragraph_open ||
    ((tokens, idx, options, _env, self) =>
      self.renderToken(tokens, idx, options))

  md.renderer.rules.paragraph_open = function (
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
}

const imgSolarNetworkPlugin: PluginWithParams = (
  md,
  { serverUrl }: { serverUrl: string }
) => {
  const originalImageRender = md.renderer.rules.image!

  md.renderer.rules.image = (
    tokens,
    index,
    options,
    env,
    self
  ): Promise<string> | string => {
    tokens[index]!.attrSet("loading", "lazy")

    const ogSrc = tokens[index]!.attrGet("src")
    if (ogSrc && ogSrc.startsWith("solian://files/")) {
      const newSrc = ogSrc.replace(
        "solian://files/",
        serverUrl + "/drive/files/"
      )
      tokens[index]!.attrSet("src", newSrc)
      tokens[index]!.attrSet("class", "prose-img-solar-network")
    }

    return originalImageRender(tokens, index, options, env, self)
  }
}
