import { Args, Command } from "@effect/cli"
import { Console, Effect } from "effect"
import { SentryApi } from "../../api/client.js"
import { orgOption, requireOrg } from "../shared.js"

const nameArg = Args.text({ name: "name" }).pipe(
  Args.withDescription("Team name")
)

export const teamsCreateCommand = Command.make(
  "create",
  { org: orgOption, name: nameArg },
  ({ org, name }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* requireOrg(org)

      const team = yield* api.createTeam({
        organizationSlug,
        name,
      })

      yield* Console.log(`Created team: ${team.slug}`)
      yield* Console.log(`  Name: ${team.name}`)
      yield* Console.log(`  ID: ${team.id}`)
    })
).pipe(Command.withDescription("Create a new team"))
