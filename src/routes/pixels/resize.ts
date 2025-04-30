import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import WebSocket from "ws"
import { toJson } from "../../extra/toJson"
import { genericSuccessResponse } from "../../types/ApiReponse"
import type { SocketPayload } from "../../types/SocketActions"

type Body = {
  width: number
  height: number
}

export const resize: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Body: Body }
> = {
  method: "POST",
  url: "/resize",
  schema: {
    body: {
      type: "object",
      required: ["width", "height"],
      properties: {
        width: { type: "integer" },
        height: { type: "integer" },
      },
    },
  },
  config: {
    rateLimit: {
      max: 5,
      timeWindow: "1s",
    },
  },
  async handler(request, response) {
    const { width, height } = request.body

    await request.server.cache.canvasManager.resize(width, height)

    for (const client of request.server.websocketServer.clients) {
      if (client.readyState !== WebSocket.OPEN) continue

      const payload: SocketPayload<"RESET"> = { op: "RESET" }

      client.send(toJson(payload))
    }

    return response.code(200).send(genericSuccessResponse)
  },
}
