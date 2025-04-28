import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { WebSocket } from "ws"
import { EntityNotFoundError } from "../../errors"
import { toJson } from "../../extra/toJson"
import { genericSuccessResponse } from "../../types/ApiReponse"
import type { SocketPayload } from "../../types/SocketActions"

interface ApiBody {
  name?: string
  ended?: boolean
  cooldown?: number
}

export const change: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Body: ApiBody }
> = {
  method: "POST",
  url: "/change",
  schema: {
    body: {
      type: "object",
      required: [],
      properties: {
        name: { type: "string", maxLength: 32 },
        ended: { type: "boolean" },
        cooldown: { type: "integer", minimum: 1 },
      },
    },
  },
  config: {
    rateLimit: {
      max: 3,
      timeWindow: "1s",
    },
  },
  async handler(request, response) {
    const { game } = request.server

    if (!game) {
      throw new EntityNotFoundError("game")
    }

    if (
      request.body.ended !== game.ended &&
      typeof request.body.ended === "boolean"
    ) {
      game.ended = request.body.ended

      if (request.body.ended) {
        clearInterval(request.server.cache.interval)

        request.server.cache.canvasManager.sendPixels()
      } else {
        await request.server.cache.canvasManager.init()

        request.server.cache.createInterval()
      }

      for (const client of request.server.websocketServer.clients) {
        if (client.readyState !== WebSocket.OPEN) continue

        const payload: SocketPayload<"ENDED"> = {
          op: "ENDED",
          value: game.ended,
        }

        client.send(toJson(payload))
      }
    }

    game.cooldown = request.body.cooldown ?? game.cooldown
    game.name = request.body.name ?? game.name

    await request.server.database.games.updateOne(
      { id: 0 },
      { $set: { ended: game.ended, cooldown: game.cooldown, name: game.name } },
    )

    return response.code(202).send(genericSuccessResponse)
  },
}
