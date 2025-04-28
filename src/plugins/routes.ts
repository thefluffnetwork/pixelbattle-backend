import type { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import { bans } from "../routes/bans"
import { favicon } from "../routes/favicon"
import { info } from "../routes/game"
import { login } from "../routes/login"
import { moderators } from "../routes/moderators"
import { pixels } from "../routes/pixels"
import { root } from "../routes/root"
import { users } from "../routes/users"

export const routes = fp(async (app: FastifyInstance) => {
  app.register(bans, { prefix: "/bans" })
  app.register(info, { prefix: "/game" })
  app.register(moderators, { prefix: "/moderators" })
  app.register(pixels, { prefix: "/pixels" })
  app.register(users, { prefix: "/users" })

  app.route(favicon)
  app.route(root)
  app.route(login)

  return
})
