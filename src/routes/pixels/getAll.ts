import { encode } from "fast-png"
import type { RouteOptions } from "fastify"

export const getAll: RouteOptions = {
  method: "GET",
  url: ".png",
  schema: {},
  config: {
    rateLimit: {
      max: 100,
      timeWindow: "1s",
    },
  },
  handler: async function handler(request, response) {
    const image = encode({
      width: request.server.game.width,
      height: request.server.game.height,
      channels: 3,
      data: request.server.cache.canvasManager.colors,
    })

    return response.header("Content-Type", "image/png").code(200).send(image)
  },
}
