import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { genericSuccessResponse } from "../../types/ApiReponse"

export const sync: RouteOptions<Server, IncomingMessage, ServerResponse> = {
  method: "POST",
  url: "/sync",
  config: {
    rateLimit: {
      max: 5,
      timeWindow: "1s",
    },
  },
  async handler(request, response) {
    const { canvasManager } = request.server.cache

    canvasManager.sendPixels()

    return response.code(200).send(genericSuccessResponse)
  },
}
