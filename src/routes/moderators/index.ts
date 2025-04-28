import type { FastifyInstance } from "fastify"
import { UserRole } from "../../models/MongoUser"
import { authRequired } from "../../plugins/authRequired"
import { bindUser } from "../../plugins/bindUser"
import { minUserRole } from "../../plugins/minUserRole"
import { edit } from "./edit"
import { getAll } from "./getAll"

export function moderators(app: FastifyInstance, _: unknown, done: () => void) {
  app.route(getAll)

  app.register(async (app, _, done) => {
    await app.register(bindUser)
    await app.register(authRequired)
    await app.register(minUserRole, {
      minRole: UserRole.Admin,
    })

    app.route(edit)
    done()
  })

  done()
}
