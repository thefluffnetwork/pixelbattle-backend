import type { SocketStream } from "@fastify/websocket"
import type { RouteOptions } from "fastify"
import type WebSocket from "ws"
import type { SocketPayload } from "../../types/SocketActions"

export type SocketConnection = SocketStream & {
  socket: WebSocket.WebSocket & { requestIp: string }
}

export const socket: RouteOptions = {
  method: "GET",
  url: "/socket",
  schema: {},
  config: {
    rateLimit: {
      max: 100,
      timeWindow: "1s",
    },
  },
  handler(request, response) {
    return response.status(418).send("why did you check this?")
  },
  wsHandler(connection, request) {
    connection.setEncoding("utf8")

    const cloudflareIpHeaders = request.headers["cf-connecting-ip"]
    const ip = cloudflareIpHeaders
      ? Array.isArray(cloudflareIpHeaders)
        ? cloudflareIpHeaders[0]
        : cloudflareIpHeaders
      : request.ip
    ;(connection as SocketConnection).socket.requestIp = ip

    const action: SocketPayload<"ENDED"> = {
      op: "ENDED",
      value: request.server.game.ended,
    }

    connection.write(JSON.stringify(action))
  },
}
