import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { EntityNotFoundError } from "../../errors"
import type { UserRole } from "../../models/MongoUser"
import { genericSuccessResponse } from "../../types/ApiReponse"

interface Body {
  action: boolean
}

export const edit: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Body: Body; Params: { id: string } }
> = {
  method: "POST",
  url: "/:id/edit",
  schema: {
    body: {
      type: "object",
      required: ["action"],
      properties: {
        action: { type: "boolean" },
      },
    },
  },
  config: {
    rateLimit: {
      max: 1,
      timeWindow: "3s",
    },
  },
  async handler(request, response) {
    const user = await request.server.cache.usersManager.edit(
      { userID: request.params.id },
      { role: Number(request.body.action) as UserRole },
    )

    if (!user) {
      throw new EntityNotFoundError("user")
    }

    return response.code(202).send(genericSuccessResponse)
  },
}
