import { Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { orgOption, projectOption, limitOption, resolveProject } from "../shared.js"

const queryOption = Options.text("query").pipe(
  Options.withAlias("q"),
  Options.withDescription("Search query (e.g., is:unresolved)"),
  Options.optional
)

const sortOption = Options.choice("sort", ["user", "freq", "date", "new"]).pipe(
  Options.withDescription("Sort by: user, freq, date, new"),
  Options.optional
)

export const issuesSearchCommand = Command.make(
  "search",
  {
    org: orgOption,
    project: projectOption,
    query: queryOption,
    sort: sortOption,
    limit: limitOption,
  },
  ({ org, project, query, sort, limit }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()
      const projectSlug = yield* resolveProject(project)

      const issues = yield* api.listIssues({
        organizationSlug,
        projectSlug,
        query: Option.getOrUndefined(query) ?? null,
        sortBy: Option.getOrUndefined(sort) as "user" | "freq" | "date" | "new" | undefined,
        limit,
      })

      if (issues.length === 0) {
        yield* Console.log("No issues found.")
        return
      }

      yield* Console.log(`Issues in ${organizationSlug}${projectSlug ? `/${projectSlug}` : ""}:`)
      yield* Console.log("")

      for (const issue of issues) {
        yield* Console.log(`  ${issue.shortId}: ${issue.title}`)
        yield* Console.log(`    Status: ${issue.status}`)
        yield* Console.log(`    Events: ${issue.count} | Users: ${issue.userCount}`)
        yield* Console.log(`    First seen: ${issue.firstSeen}`)
        yield* Console.log(`    Last seen: ${issue.lastSeen}`)
        yield* Console.log(`    URL: ${issue.permalink}`)
        yield* Console.log("")
      }
    }).pipe(Effect.provide(OrgService.make(org)))
).pipe(Command.withDescription("Search for issues"))
