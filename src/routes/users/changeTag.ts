import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { RouteOptions } from "fastify"
import { InvalidPlayerTagError } from "../../errors"
import { genericSuccessResponse } from "../../types/ApiReponse"

interface Body {
  tag?: string
}

export const changeTag: RouteOptions<
  Server,
  IncomingMessage,
  ServerResponse,
  { Body: Body; Params: { id: string } }
> = {
  method: "POST",
  url: "/:id/tag",
  schema: {
    body: {
      type: "object",
      required: [],
      properties: {
        tag: { type: "string" },
      },
    },
  },
  config: {
    rateLimit: {
      max: 100,
      timeWindow: "1s",
    },
  },
  async preHandler(request, _response, done) {
    if (
      request.body.tag &&
      !request.server.game.tags.includes(request.body.tag)
    ) {
      throw new InvalidPlayerTagError(
        request.body.tag,
        request.server.game.tags,
      )
    }

    done()
  },
  async handler(request, response) {
    await request.server.cache.usersManager.edit(
      {
        token: request.headers.authorization?.slice("Bearer ".length),
        userID: request.params.id,
      },
      {
        tag: !request.body.tag
          ? null
          : request.body.tag.replace(/\s+/i, " ").trim(),
      },
      { force: true },
    )
    // await request.server.database.users
    //     .updateOne(
    //         {
    //             token: request.body.token,
    //             userID: request.params.id
    //         },
    //         {
    //             $set: {
    //                 tag: (!request.body.tag) ? null : request.body.tag.replace(/\s+/i, ' ').trim()
    //             }
    //         }
    //     );

    return response.code(200).send(genericSuccessResponse)
  },
}
