import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { WebSocket } from "ws"
import { config } from "../../config"
import {
  EndedError,
  TokenBannedError,
  UserCooldownError,
  WrongTokenError,
} from "../../errors"
import { toJson } from "../../extra/toJson"
import { LoggingHelper } from "../../helpers/LoggingHelper"
import { UserRole } from "../../models/MongoUser"
import { genericSuccessResponse } from "../../types/ApiReponse"
import type { SocketPayload } from "../../types/SocketActions"

interface Body {
  color: string
  x: number
  y: number
}

export const update: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Body: Body }
> = {
  method: "PUT",
  url: "/",
  schema: {
    body: {
      type: "object",
      required: ["color", "x", "y"],
      properties: {
        color: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        x: { type: "integer" },
        y: { type: "integer" },
      },
    },
  },
  config: {
    rateLimit: {
      max: 80,
      timeWindow: "1s",
    },
  },
  async preHandler(request, _response, done) {
    if (!request.user) {
      throw new WrongTokenError()
    }

    if (request.server.game.ended) {
      throw new EndedError()
    }

    if (request.user.banned) {
      throw new TokenBannedError()
    }

    const now = Date.now()
    if (request.user.cooldown > now) {
      const time = Number(((request.user.cooldown - now) / 1000).toFixed(1))

      throw new UserCooldownError(time)
    }

    done()
  },
  async handler(request, response) {
    if (!request.user) {
      throw new WrongTokenError()
    }

    const x = Number(request.body.x)
    const y = Number(request.body.y)
    const color = request.body.color

    const cooldown =
      Date.now() +
      (request.user.role !== UserRole.User
        ? config.moderatorCooldown
        : request.server.game.cooldown)

    await request.server.cache.usersManager.edit(
      { token: request.user.token },
      { cooldown },
    )

    const cacheKey = `${request.user.userID}-${x}-${y}-${color}` as const

    if (!request.server.cache.set.has(cacheKey)) {
      const tag = request.user.role !== UserRole.User ? null : request.user.tag

      request.server.cache.canvasManager.paint({
        x,
        y,
        color,
        tag,
        author: request.user.username,
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

      LoggingHelper.sendPixelPlaced({
        tag,
        userID: request.user.userID,
        x,
        y,
        color,
      })

      request.server.cache.set.add(cacheKey)
      setTimeout(() => request.server.cache.set.delete(cacheKey), 600) // CORS spam fix
    }

    return response.code(200).send(genericSuccessResponse)
  },
}
