// @effect-diagnostics strictEffectProvide:off
import { Command } from "@effect/cli"
import { Console, Effect, Layer } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { ProjectService } from "../../services/project-service.js"
import { orgOption, projectOption } from "../shared.js"

export const dsnsListCommand = Command.make(
  "list",
  { org: orgOption, project: projectOption },
  ({ org, project }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()
      const projectSlug = yield* (yield* ProjectService).get()

      const keys = yield* api.listClientKeys({
        organizationSlug,
        projectSlug,
      })

      if (keys.length === 0) {
        yield* Console.log("No DSNs found.")
        return
      }

      yield* Console.log(`DSNs for ${organizationSlug}/${projectSlug}:`)
      yield* Console.log("")

      for (const key of keys) {
        yield* Console.log(`  ${key.name}`)
        yield* Console.log(`    DSN: ${key.dsn.public}`)
        yield* Console.log(`    Active: ${key.isActive ? "Yes" : "No"}`)
        yield* Console.log(`    Created: ${key.dateCreated}`)
        yield* Console.log("")
      }
    }).pipe(
      Effect.provide(
        Layer.merge(
          OrgService.make(org),
          Layer.provide(ProjectService.make(project), OrgService.make(org))
        )
      )
    )
).pipe(Command.withDescription("List DSNs for a project"))
