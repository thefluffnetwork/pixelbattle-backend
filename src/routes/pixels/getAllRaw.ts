import type { RouteOptions } from "fastify"
import type { Pixel } from "../../models/MongoPixel"

export const getAllRaw: RouteOptions = {
  method: "GET",
  url: ".json",
  schema: {},
  config: {
    rateLimit: {
      max: 100,
      timeWindow: "1s",
    },
  },
  handler: async function handler(request, response) {
    // to be deprecated
    return response
      .header("Content-Type", "image/json")
      .code(200)
      .send({
        pixels: request.server.cache.canvasManager.pixels.map((pix: Pixel) => ({
          x: pix.x,
          y: pix.y,
          color: request.server.cache.canvasManager.getColor({
            x: pix.x,
            y: pix.y,
          }),
        })),
        width: request.server.game.width,
        height: request.server.game.height,
      })
  },
}
