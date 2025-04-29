import type { FastifyInstance } from "fastify"
import { UserRole } from "../../models/MongoUser"
import { authRequired } from "../../plugins/authRequired"
import { bindUser } from "../../plugins/bindUser"
import { minUserRole } from "../../plugins/minUserRole"
import { clear } from "./clear"
import { fill } from "./fill"
import { getAll } from "./getAll"
import { getAllRaw } from "./getAllRaw"
import { getOne } from "./getOne"
import { getTags } from "./getTags"
import { socket } from "./socket"
import { sync } from "./sync"
import { update } from "./update"

export function pixels(app: FastifyInstance, _: unknown, done: () => void) {
  app.route(getAll)
  app.route(getAllRaw)
  app.route(getOne)
  app.route(getTags)
  app.route(socket)

  app.register(async (app, _, done) => {
    await app.register(bindUser)
    await app.register(authRequired)

    app.route(update)

    done()
  })

  app.register(async (app, _, done) => {
    await app.register(bindUser)
    await app.register(authRequired)
    await app.register(minUserRole, {
      minRole: UserRole.Admin,
    })

    app.route(clear)
    app.route(fill)
    app.route(sync)

    done()
  })

  done()
}
