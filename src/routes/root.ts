import type { RouteOptions } from "fastify"

export const root: RouteOptions = {
	method: "GET",
	url: "/",
	schema: {},
	handler: (request, response) => response
			.code(200)
			.send({
				error: false,
				reason: "PixelAPI v4 works! Good time for chill :D",
			}),
}
