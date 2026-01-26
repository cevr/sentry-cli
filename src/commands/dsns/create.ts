// @effect-diagnostics strictEffectProvide:off
import { Command, Options } from "@effect/cli"
import { Console, Effect, Layer, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { ProjectService } from "../../services/project-service.js"
import { orgOption, projectOption } from "../shared.js"

const nameOption = Options.text("name").pipe(
  Options.withAlias("n"),
  Options.withDescription("DSN name"),
  Options.optional
)

export const dsnsCreateCommand = Command.make(
  "create",
  { org: orgOption, project: projectOption, name: nameOption },
  ({ org, project, name }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()
      const projectSlug = yield* (yield* ProjectService).get()

      const key = yield* api.createClientKey({
        organizationSlug,
        projectSlug,
        name: Option.getOrUndefined(name) ?? "CLI Generated Key",
      })

      yield* Console.log(`Created DSN: ${key.name}`)
      yield* Console.log("")
      yield* Console.log(`DSN: ${key.dsn.public}`)
      yield* Console.log("")
      yield* Console.log("Add this to your SDK configuration:")
      yield* Console.log(`  SENTRY_DSN=${key.dsn.public}`)
    }).pipe(
      Effect.provide(
        Layer.merge(
          OrgService.make(org),
          Layer.provide(ProjectService.make(project), OrgService.make(org))
        )
      )
    )
).pipe(Command.withDescription("Create a new DSN"))
