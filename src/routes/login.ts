import type { RouteOptions } from "fastify"
import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { CookieSerializeOptions } from "@fastify/cookie"
import { AuthHelper } from "../helpers/AuthHelper"
import type { MongoUser } from "../models/MongoUser"
import { utils } from "../extra/Utils"
import { config } from "../config"
import { AuthLoginError, NotVerifiedEmailError } from "../errors"
import { UserRole } from "../models/MongoUser"

export const login: RouteOptions<
	Server,
	IncomingMessage,
	ServerResponse,
	{ Querystring: { code: string } }
> = {
	method: "GET",
	url: "/login",
	schema: {
		querystring: {
			code: { type: "string" },
		},
	},
	config: {
		rateLimit: {
			max: 2,
			timeWindow: "5s",
		},
	},
	async handler(request, response) {
		const auth = new AuthHelper()
		const data = await auth.authCodeGrant(request.query.code)

		if ("error" in data) throw new AuthLoginError()

		const { id, username, verified } = await auth.getUserInfo()

		if (!verified) throw new NotVerifiedEmailError()

		const user: Omit<MongoUser, "_id" | "userID" | "username"> | null =
			await request.server.database.users.findOne(
				{
					userID: id,
				},
				{
					projection: {
						_id: 0,
						userID: 0,
						username: 0,
					},
				},
			)

		const token = user?.token || utils.generateToken()

		await request.server.database.users.updateOne(
			{
				userID: id,
			},
			{
				$set: {
					token,
					userID: id,
					username: username,
					cooldown: user?.cooldown ?? 0,
					tag: user?.tag ?? null,
					badges: user?.badges ?? [],
					points: user?.points ?? 0,
					role: user?.role ?? UserRole.User,
				},
			},
			{ upsert: true },
		)

		const params: CookieSerializeOptions = {
			domain: config.frontend.split("//")[1].split(":")[0],
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 2 weeks
			path: "/",
			httpOnly: false,
			sameSite: "none",
			secure: true,
		}

		return response
			.cookie("token", token, params)
			.cookie("userid", id, params)
			.redirect(config.frontend)
	},
}
