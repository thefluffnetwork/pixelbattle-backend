import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { EntityNotFoundError } from "../../errors"

export const getUserByUsername: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Params: { username: string } }
> = {
  method: "GET",
  url: "/username/:username",
  schema: {},
  config: {
    rateLimit: {
      max: 100,
      timeWindow: "1s",
    },
  },
  async handler(request, response) {
    const user = await request.server.cache.usersManager.get({
      username: request.params.username,
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
