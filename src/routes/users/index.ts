import type { FastifyInstance } from "fastify"
import { UserRole } from "../../models/MongoUser"
import { authRequired } from "../../plugins/authRequired"
import { bindUser } from "../../plugins/bindUser"
import { minUserRole } from "../../plugins/minUserRole"
import { ban } from "./ban"
import { changeTag } from "./changeTag"
import { getUser } from "./getOne"
import { role } from "./role"
import { unban } from "./unban"

export function users(app: FastifyInstance, _: unknown, done: () => void) {
  app.route(getUser)

  app.register(async (app, _, done) => {
    await app.register(bindUser)
    await app.register(authRequired)

    app.route(changeTag)

    done()
  })

  app.register(async (app, _, done) => {
    await app.register(bindUser)
    await app.register(authRequired)
    await app.register(minUserRole, {
      minRole: UserRole.Moderator,
    })

    app.route(ban)
    app.route(unban)

    done()
  })

  app.register(async (app, _, done) => {
    await app.register(bindUser)
    await app.register(authRequired)
    await app.register(minUserRole, { minRole: UserRole.Admin })

    app.route(role)

    done()
  })

  done()
}
