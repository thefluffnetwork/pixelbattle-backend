import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { WebSocket } from "ws"
import { toJson } from "../../extra/toJson"
import { genericSuccessResponse } from "../../types/ApiReponse"
import type { SocketPayload } from "../../types/SocketActions"

type Body = {
  color?: string
  topLeft: { x: number; y: number }
  bottomRight: { x: number; y: number }
}

export const fill: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Body: Body }
> = {
  method: "PUT",
  url: "/fill",
  schema: {
    body: {
      type: "object",
      required: ["topLeft", "bottomRight"],
      properties: {
        color: {
          type: "string",
          pattern: "^#[0-9A-Fa-f]{6}$",
        },
        topLeft: {
          type: "object",
          required: ["x", "y"],
          properties: {
            x: { type: "integer" },
            y: { type: "integer" },
          },
        },
        bottomRight: {
          type: "object",
          required: ["x", "y"],
          properties: {
            x: { type: "integer" },
            y: { type: "integer" },
          },
        },
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
    const { color = "#ffffff", topLeft, bottomRight } = request.body

    const { canvasManager } = request.server.cache

    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        canvasManager.paint({
          x,
          y,
          color,
          author: null,
          tag: null,
        })

        for (const client of request.server.websocketServer.clients) {
          if (client.readyState !== WebSocket.OPEN) continue

          const payload: SocketPayload<"PLACE"> = {
            op: "PLACE",
            x,
            y,
            color,
          }

          client.send(toJson(payload))
        }
      }
    }

    return response.code(200).send(genericSuccessResponse)
  },
}
