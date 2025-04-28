import type { FastifyRequest } from "fastify"
import fp from "fastify-plugin"
import { NotAuthorizedError } from "../errors"
import type { MongoUser } from "../models/MongoUser"

declare module "fastify" {
  interface FastifyRequest {
    user: MongoUser | null
  }
}

export const bindUser = fp(async app => {
  app.decorateRequest("user", null)

  app.addHook(
    "preHandler",
    async (
      req: FastifyRequest<{ Headers: { Authorization: `Bearer ${string}` } }>,
      _,
    ) => {
      if (!req.headers.authorization) {
        throw new NotAuthorizedError()
      }
      const userCache = await req.server.cache.usersManager.get({
        token: req.headers.authorization.slice("Bearer ".length),
      })

      if (!userCache) throw new NotAuthorizedError()

      req.user = userCache.user
    },
  )

  return
})
