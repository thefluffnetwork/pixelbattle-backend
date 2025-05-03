import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { genericSuccessResponse } from "../../types/ApiReponse"

interface Body {
  role: number
}

export const role: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Body: Body; Params: { id: string } }
> = {
  method: "POST",
  url: "/:id/role",
  schema: {
    body: {
      type: "object",
      required: [],
      properties: {
        role: { type: "integer", minimum: 0, maximum: 2 },
      },
    },
  },
  config: {
    rateLimit: {
      max: 100,
      timeWindow: "1s",
    },
  },
  async handler(request, response) {
    await request.server.cache.usersManager.edit(
      {
        userID: request.params.id,
      },
      {
        role: request.body.role,
      },
      { force: true },
    )

    return response.code(200).send(genericSuccessResponse)
  },
}
