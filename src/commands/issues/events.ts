import { Args, Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { orgOption, limitOption, requireOrg } from "../shared.js"

const queryOption = Options.text("query").pipe(
  Options.withAlias("q"),
  Options.withDescription("Filter events by query (e.g., environment:production)"),
  Options.optional
)

const periodOption = Options.text("period").pipe(
  Options.withDescription("Stats period (e.g., 24h, 7d, 14d)"),
  Options.withDefault("14d")
)

const issueArg = Args.text({ name: "issue-id" }).pipe(
  Args.withDescription("Issue ID (short ID like PROJ-123 or numeric)")
)

export const issuesEventsCommand = Command.make(
  "events",
  { org: orgOption, query: queryOption, period: periodOption, limit: limitOption, issue: issueArg },
  ({ org, query, period, limit, issue }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* requireOrg(org)

      const events = yield* api.listEventsForIssue({
        organizationSlug,
        issueId: issue,
        query: Option.getOrUndefined(query),
        limit,
        sort: "-timestamp",
        statsPeriod: period,
      })

      if (events.length === 0) {
        yield* Console.log("No events found.")
        return
      }

      yield* Console.log(`Events for issue ${issue}:`)
      yield* Console.log("")

      for (const event of events) {
        yield* Console.log(`  ${event.id}`)
        yield* Console.log(`    Title: ${event.title}`)
        yield* Console.log(`    Type: ${String(event.type)}`)
        // dateCreated is only present on some event types
        if ("dateCreated" in event && event.dateCreated) {
          yield* Console.log(`    Date: ${event.dateCreated}`)
        }
        if (event.message) {
          yield* Console.log(`    Message: ${event.message}`)
        }
        if (event.platform) {
          yield* Console.log(`    Platform: ${event.platform}`)
        }
        yield* Console.log("")
      }

      if (events.length === limit) {
        yield* Console.log(`(Showing ${limit} results. Use --limit to see more.)`)
      }
    })
).pipe(Command.withDescription("List events for an issue"))
