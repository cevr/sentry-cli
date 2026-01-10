import { Command, Options } from "@effect/cli"
import { Console, Effect } from "effect"
import { SentryApi } from "../../api/client.js"
import { orgOption, requireOrg } from "../shared.js"

const projectOption = Options.text("project").pipe(
  Options.withAlias("p"),
  Options.withDescription("Project slug")
)

export const dsnsListCommand = Command.make(
  "list",
  { org: orgOption, project: projectOption },
  ({ org, project }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* requireOrg(org)

      const keys = yield* api.listClientKeys({
        organizationSlug,
        projectSlug: project,
      })

      if (keys.length === 0) {
        yield* Console.log("No DSNs found.")
        return
      }

      yield* Console.log(`DSNs for ${organizationSlug}/${project}:`)
      yield* Console.log("")

      for (const key of keys) {
        yield* Console.log(`  ${key.name}`)
        yield* Console.log(`    DSN: ${key.dsn.public}`)
        yield* Console.log(`    Active: ${key.isActive ? "Yes" : "No"}`)
        yield* Console.log(`    Created: ${key.dateCreated}`)
        yield* Console.log("")
      }
    })
).pipe(Command.withDescription("List DSNs for a project"))
