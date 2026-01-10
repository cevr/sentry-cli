import { Command } from "@effect/cli"
import { Console, Effect } from "effect"
import { SentryApi } from "../api/client.js"

export const whoamiCommand = Command.make("whoami", {}, () =>
  Effect.gen(function* () {
    const api = yield* SentryApi
    const user = yield* api.getAuthenticatedUser()

    yield* Console.log(`Authenticated as: ${user.name ?? "Unknown"} <${user.email}>`)
    yield* Console.log(`User ID: ${user.id}`)
  })
).pipe(Command.withDescription("Show the currently authenticated user"))
