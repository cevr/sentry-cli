// @effect-diagnostics strictEffectProvide:off
import { Command } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { orgOption, projectOption, queryOption, resolveProject } from "../shared.js"

export const releasesListCommand = Command.make(
  "list",
  { org: orgOption, project: projectOption, query: queryOption },
  ({ org, project, query }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()
      const projectSlug = yield* resolveProject(project)

      const releases = yield* api.listReleases({
        organizationSlug,
        projectSlug,
        query: Option.getOrUndefined(query),
      })

      if (releases.length === 0) {
        yield* Console.log("No releases found.")
        return
      }

      yield* Console.log(
        `Releases in ${organizationSlug}${projectSlug !== undefined ? `/${projectSlug}` : ""}:`
      )
      yield* Console.log("")

      for (const release of releases) {
        yield* Console.log(`  ${release.shortVersion}`)
        yield* Console.log(`    Version: ${release.version}`)
        yield* Console.log(`    Created: ${release.dateCreated}`)
        if (release.dateReleased !== undefined && release.dateReleased !== null) {
          yield* Console.log(`    Released: ${release.dateReleased}`)
        }
        yield* Console.log(`    New issues: ${release.newGroups}`)

        if (release.lastCommit !== undefined && release.lastCommit !== null) {
          yield* Console.log(`    Last commit: ${release.lastCommit.message.split("\n")[0]}`)
          yield* Console.log(
            `      by ${release.lastCommit.author.name} <${release.lastCommit.author.email}>`
          )
        }

        if (release.lastDeploy !== undefined && release.lastDeploy !== null) {
          yield* Console.log(`    Last deploy: ${release.lastDeploy.environment}`)
        }

        const projectNames = release.projects.map((p) => p.slug).join(", ")
        yield* Console.log(`    Projects: ${projectNames}`)
        yield* Console.log("")
      }
    }).pipe(Effect.provide(OrgService.make(org)))
).pipe(Command.withDescription("List releases"))
