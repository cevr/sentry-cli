// @effect-diagnostics strictEffectProvide:off
import { Args, Command } from "@effect/cli"
import { Console, Effect } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { orgOption } from "../shared.js"

const nameArg = Args.text({ name: "name" }).pipe(
  Args.withDescription("Team name")
)

export const teamsCreateCommand = Command.make(
  "create",
  { org: orgOption, name: nameArg },
  ({ org, name }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()

      const team = yield* api.createTeam({
        organizationSlug,
        name,
      })

      yield* Console.log(`Created team: ${team.slug}`)
      yield* Console.log(`  Name: ${team.name}`)
      yield* Console.log(`  ID: ${team.id}`)
    }).pipe(Effect.provide(OrgService.make(org)))
).pipe(Command.withDescription("Create a new team"))
