import { Command } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { orgOption, queryOption, requireOrg } from "../shared.js"

export const projectsListCommand = Command.make(
  "list",
  { org: orgOption, query: queryOption },
  ({ org, query }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* requireOrg(org)

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
        if (project.platform) {
          yield* Console.log(`    Platform: ${project.platform}`)
        }
        yield* Console.log(`    ID: ${project.id}`)
        yield* Console.log("")
      }

      if (projects.length === 25) {
        yield* Console.log("(Showing max 25 results. Use --query to filter.)")
      }
    })
).pipe(Command.withDescription("List projects in an organization"))
