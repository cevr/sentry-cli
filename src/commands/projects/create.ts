// @effect-diagnostics strictEffectProvide:off
import { Args, Command, Options } from "@effect/cli"
import { Console, Effect, Layer, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { TeamService } from "../../services/team-service.js"
import { orgOption, teamOption } from "../shared.js"

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
      const organizationSlug = yield* (yield* OrgService).get()
      const teamSlug = yield* (yield* TeamService).get()

      const project = yield* api.createProject({
        organizationSlug,
        teamSlug,
        name,
        platform: Option.getOrUndefined(platform) ?? null,
      })

      yield* Console.log(`Created project: ${project.slug}`)
      yield* Console.log(`  Name: ${project.name}`)
      yield* Console.log(`  ID: ${project.id}`)
      if (project.platform !== undefined && project.platform !== null) {
        yield* Console.log(`  Platform: ${project.platform}`)
      }
    }).pipe(
      Effect.provide(
        Layer.merge(
          OrgService.make(org),
          Layer.provide(TeamService.make(team), OrgService.make(org))
        )
      )
    )
).pipe(Command.withDescription("Create a new project"))
