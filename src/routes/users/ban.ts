import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { EntityNotFoundError } from "../../errors"
import type { BanInfo } from "../../models/MongoUser"
import type { MongoUser } from "../../models/MongoUser"
import { genericSuccessResponse } from "../../types/ApiReponse"

export const ban: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Params: { id: string }; Body: BanInfo }
> = {
  method: "POST",
  url: "/:id/ban",
  schema: {
    body: {
      type: "object",
      required: ["timeout"],
      properties: {
        reason: { type: "string" },
        timeout: { type: "number" },
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
    const user = await request.server.cache.usersManager.edit(
      { userID: request.params.id },
      {
        banned: {
          moderatorID: (request.user as MongoUser).userID,
          reason: request.body.reason || null,
          timeout: request.body.timeout,
        },
      },
      { force: true },
    )

    if (!user) {
      throw new EntityNotFoundError("user")
    }

    return response.status(200).send(genericSuccessResponse)
  },
}
