import type { RouteOptions } from "fastify"

export const getTags: RouteOptions = {
  method: "GET",
  url: "/tag",
  schema: {},
  config: {
    rateLimit: {
      max: 2,
      timeWindow: "5s",
    },
  },
  async handler(request, response) {
    const pixels = request.server.cache.canvasManager.pixelCache
    const game = request.server.game

    let taggedPixelCount = 0

    const taggedPixles = new Map<string, number>()

    for (const tag of game.tags) {
      taggedPixles.set(tag, 0)
    }

    for (const [, pixel] of pixels) {
      if (pixel.tag === null) {
        continue
      }

      taggedPixelCount++

      const currentValue = taggedPixles.get(pixel.tag) ?? 0

      taggedPixles.set(pixel.tag, currentValue + 1)
    }

    const tags = Array.from(taggedPixles.keys()).sort((a, b) => {
      const aCount = taggedPixles.get(b) ?? 0
      const bCount = taggedPixles.get(a) ?? 0

      return bCount - aCount
    })

    return response.send({
      pixels: {
        all: game.width * game.height,
        used: taggedPixelCount,
        unused: game.width * game.height - taggedPixelCount,
      },
      tags,
    })
  },
}
