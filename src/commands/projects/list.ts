// @effect-diagnostics strictEffectProvide:off
import { Command } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { orgOption, queryOption } from "../shared.js"

export const projectsListCommand = Command.make(
  "list",
  { org: orgOption, query: queryOption },
  ({ org, query }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()

      const projects = yield* api.listProjects(organizationSlug, {
        query: Option.getOrUndefined(query),
      })

      if (projects.length === 0) {
        yield* Console.log("No projects found.")
        return
      }

      yield* Console.log(`Projects in ${organizationSlug}:`)
      yield* Console.log("")

      for (const project of projects) {
        yield* Console.log(`  ${project.slug}`)
        yield* Console.log(`    Name: ${project.name}`)
        if (project.platform !== undefined && project.platform !== null) {
          yield* Console.log(`    Platform: ${project.platform}`)
        }
        yield* Console.log(`    ID: ${project.id}`)
        yield* Console.log("")
      }

      if (projects.length === 25) {
        yield* Console.log("(Showing max 25 results. Use --query to filter.)")
      }
    }).pipe(Effect.provide(OrgService.make(org)))
).pipe(Command.withDescription("List projects in an organization"))
