import { readFile } from "node:fs/promises"
import type { RouteOptions } from "fastify"

export const favicon: RouteOptions = {
  method: "GET",
  url: "/favicon.ico",
  schema: {},
  config: {
    rateLimit: {
      max: 1,
      timeWindow: "3s",
    },
  },
  async handler(request, response) {
    return response
      .header("Content-Type", "image/x-icon")
      .code(200)
      .send(await readFile("./api/assets/favicon.ico"))
  },
}
