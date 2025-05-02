import type { Collection, Db } from "mongodb"
import type { MongoGame } from "../models/MongoGame"
import type { MongoPixel } from "../models/MongoPixel"
import type { MongoUser } from "../models/MongoUser"

declare module "mongodb" {
  interface Db {
    collection<K extends keyof PixelDatabase>(
      name: K,
      options?: CollectionOptions | undefined,
    ): Collection<PixelDatabase[K]>
  }
}

export interface PixelDatabase {
  users: MongoUser
  pixels: MongoPixel
  games: MongoGame
}

export type PixelDatabaseCollections = {
  [K in keyof PixelDatabase]: Collection<PixelDatabase[K]>
}

export function createDatabaseMap(database: Db) {
  const keys: (keyof PixelDatabase)[] = ["games", "pixels", "users"]

  return Object.fromEntries(
    keys.map(key => [key, database.collection(key)]),
  ) as PixelDatabaseCollections
}
