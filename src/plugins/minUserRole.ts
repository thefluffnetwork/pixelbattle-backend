import fp from "fastify-plugin"
import { NotEnoughPrivilegesError } from "../errors"
import type { UserRole } from "../models/MongoUser"

interface UserRoleOptions {
  minRole: UserRole
}

export const minUserRole = fp<UserRoleOptions>(async (app, options) => {
  app.addHook("preHandler", async req => {
    if (req.user?.role && options.minRole > req.user.role) {
      throw new NotEnoughPrivilegesError(options.minRole)
    }
  })

  return
})
