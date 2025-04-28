import fp from "fastify-plugin"
import { config } from "../config"
import type { WithId } from "mongodb"
import type { MongoGame } from "../models/MongoGame"

declare module "fastify" {
  interface FastifyInstance {
    game: WithId<MongoGame>
  }
}

export const game = fp(async app => {
  // Find existing game or create new one and find it
  // Needs improvement:
  // 1. Get the latest game automatically
  // 2. Create a new game if necessary
  // etc...
  const game =
    (await app.database.games.findOne({ id: 0 })) ??
    (await app.database.games
      .insertOne({ id: 0, ...config.game })
      .then(r => app.database.games.findOne({ _id: r.insertedId })))

  if (!game) {
    throw new Error("No game found")
  }

  app.decorate("game", game)

  return
})
