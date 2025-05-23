import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { EntityNotFoundError } from "../../errors"

export const getUser: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Params: { id: string } }
> = {
  method: "GET",
  url: "/:id",
  schema: {},
  config: {
    rateLimit: {
      max: 100,
      timeWindow: "1s",
    },
  },
  async handler(request, response) {
    const user = await request.server.cache.usersManager.get({
      userID: request.params.id,
    })

    if (!user) {
      throw new EntityNotFoundError("user")
    }

    return response.send({
      ...user.user,
      token: undefined,
    })
  },
}
