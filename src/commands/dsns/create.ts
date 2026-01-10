import { Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { orgOption, requireOrg } from "../shared.js"

const projectOption = Options.text("project").pipe(
  Options.withAlias("p"),
  Options.withDescription("Project slug")
)

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
      const organizationSlug = yield* requireOrg(org)

      const key = yield* api.createClientKey({
        organizationSlug,
        projectSlug: project,
        name: Option.getOrUndefined(name) ?? "CLI Generated Key",
      })

      yield* Console.log(`Created DSN: ${key.name}`)
      yield* Console.log("")
      yield* Console.log(`DSN: ${key.dsn.public}`)
      yield* Console.log("")
      yield* Console.log("Add this to your SDK configuration:")
      yield* Console.log(`  SENTRY_DSN=${key.dsn.public}`)
    })
).pipe(Command.withDescription("Create a new DSN"))
