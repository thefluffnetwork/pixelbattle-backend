import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { EntityNotFoundError } from "../../errors"
import type { SocketConnection } from "../pixels/socket"

interface ApiInfo {
  name: string
  cooldown: number
  ended: boolean
  canvas: {
    width: number
    height: number
  }
  online: number
}

export const get: RouteOptions<Server, IncomingMessage, ServerResponse> = {
  method: "GET",
  url: "/",
  schema: {},
  config: {
    rateLimit: {
      max: 3,
      timeWindow: "1s",
    },
  },
  async handler(request, response) {
    const online = new Set()

    for (const client of request.server.websocketServer.clients) {
      online.add((client as SocketConnection["socket"]).requestIp)
    }

    const { game } = request.server

    if (!game) {
      throw new EntityNotFoundError("games")
    }

    const info: ApiInfo = {
      name: game.name,
      cooldown: game.cooldown,
      ended: game.ended,
      canvas: {
        height: game.height,
        width: game.width,
      },
      online: online.size,
    }

    return response.code(200).send(info)
  },
}
