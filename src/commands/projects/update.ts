// @effect-diagnostics strictEffectProvide:off
import { Args, Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { orgOption } from "../shared.js"

const nameOption = Options.text("name").pipe(
  Options.withAlias("n"),
  Options.withDescription("New project name"),
  Options.optional
)

const slugOption = Options.text("slug").pipe(
  Options.withAlias("s"),
  Options.withDescription("New project slug"),
  Options.optional
)

const platformOption = Options.text("platform").pipe(
  Options.withAlias("p"),
  Options.withDescription("New platform"),
  Options.optional
)

const projectArg = Args.text({ name: "project" }).pipe(
  Args.withDescription("Project slug to update")
)

export const projectsUpdateCommand = Command.make(
  "update",
  {
    org: orgOption,
    name: nameOption,
    slug: slugOption,
    platform: platformOption,
    project: projectArg,
  },
  ({ org, name, slug, platform, project }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()

      const nameValue = Option.getOrUndefined(name)
      const slugValue = Option.getOrUndefined(slug)
      const platformValue = Option.getOrUndefined(platform)

      if (nameValue === undefined && slugValue === undefined && platformValue === undefined) {
        yield* Console.error("No updates specified. Use --name, --slug, or --platform.")
        return
      }

      const updated = yield* api.updateProject({
        organizationSlug,
        projectSlug: project,
        name: nameValue ?? null,
        slug: slugValue ?? null,
        platform: platformValue ?? null,
      })

      yield* Console.log(`Updated project: ${updated.slug}`)
      yield* Console.log(`  Name: ${updated.name}`)
      yield* Console.log(`  ID: ${updated.id}`)
      if (updated.platform !== undefined && updated.platform !== null) {
        yield* Console.log(`  Platform: ${updated.platform}`)
      }
    }).pipe(Effect.provide(OrgService.make(org)))
).pipe(Command.withDescription("Update a project"))
