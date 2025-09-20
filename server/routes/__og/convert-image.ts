export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  let url = query.url as string

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing url parameter"
    })
  }

  try {
    if (url.endsWith(":")) url = url.substring(0, url.length - 1)
    if (url.endsWith("?original=true"))
      url = url.substring(0, url.length - "?original=true".length)
    console.log("Converting image... ", url)
    const response = await fetch(url)
    if (!response.ok) {
      throw createError({ statusCode: 404, statusMessage: "Image not found" })
    }

    const buffer = await response.arrayBuffer()
    const sharp = await import("sharp")
    const converted = await sharp.default(Buffer.from(buffer)).png().toBuffer()

    setHeader(event, "Content-Type", "image/png")
    setHeader(event, "Cache-Control", "public, max-age=3600") // Cache for 1 hour
    return converted
  } catch (error) {
    console.error("Image conversion error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: "Image conversion failed"
    })
  }
})
