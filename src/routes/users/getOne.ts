import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { EntityNotFoundError } from "../../errors"

export const getUser: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Params: { id: string } | { username: string } }
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
    let user

    if ("id" in request.params) {
      user = await request.server.cache.usersManager.get({
        userID: request.params.id,
      })
    } else if ("user" in request.params) {
      user = await request.server.cache.usersManager.get({
        username: request.params.username,
      })
    }

    if (!user) {
      throw new EntityNotFoundError("user")
    }

    return response.send({
      ...user.user,
      token: undefined,
    })
  },
}
