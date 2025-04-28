import fp from "fastify-plugin"
import { NotAuthorizedError } from "../errors"

export const authRequired = fp(async app => {
  app.addHook("preHandler", async req => {
    if (!req.user) throw new NotAuthorizedError()
  })

  return
})
