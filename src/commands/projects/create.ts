import { Args, Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { orgOption, requireOrg } from "../shared.js"

const teamOption = Options.text("team").pipe(
  Options.withAlias("t"),
  Options.withDescription("Team slug")
)

const platformOption = Options.text("platform").pipe(
  Options.withAlias("p"),
  Options.withDescription("Platform (e.g., javascript, python, node)"),
  Options.optional
)

const nameArg = Args.text({ name: "name" }).pipe(
  Args.withDescription("Project name")
)

export const projectsCreateCommand = Command.make(
  "create",
  { org: orgOption, team: teamOption, platform: platformOption, name: nameArg },
  ({ org, team, platform, name }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* requireOrg(org)

      const project = yield* api.createProject({
        organizationSlug,
        teamSlug: team,
        name,
        platform: Option.getOrUndefined(platform) ?? null,
      })

      yield* Console.log(`Created project: ${project.slug}`)
      yield* Console.log(`  Name: ${project.name}`)
      yield* Console.log(`  ID: ${project.id}`)
      if (project.platform) {
        yield* Console.log(`  Platform: ${project.platform}`)
      }
    })
).pipe(Command.withDescription("Create a new project"))
