// @effect-diagnostics strictEffectProvide:off
import { Command } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { orgOption, queryOption } from "../shared.js"

export const teamsListCommand = Command.make(
  "list",
  { org: orgOption, query: queryOption },
  ({ org, query }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()

      const teams = yield* api.listTeams(organizationSlug, {
        query: Option.getOrUndefined(query),
      })

      if (teams.length === 0) {
        yield* Console.log("No teams found.")
        return
      }

      yield* Console.log(`Teams in ${organizationSlug}:`)
      yield* Console.log("")

      for (const team of teams) {
        yield* Console.log(`  ${team.slug}`)
        yield* Console.log(`    Name: ${team.name}`)
        yield* Console.log(`    ID: ${team.id}`)
        yield* Console.log("")
      }

      if (teams.length === 25) {
        yield* Console.log("(Showing max 25 results. Use --query to filter.)")
      }
    }).pipe(Effect.provide(OrgService.make(org)))
).pipe(Command.withDescription("List teams in an organization"))
