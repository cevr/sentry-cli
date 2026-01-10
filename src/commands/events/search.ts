import { Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { orgOption, projectOption, limitOption, requireOrg } from "../shared.js"

const queryOption = Options.text("query").pipe(
  Options.withAlias("q"),
  Options.withDescription("Search query"),
  Options.withDefault("")
)

const datasetOption = Options.choice("dataset", ["spans", "errors", "logs"]).pipe(
  Options.withAlias("d"),
  Options.withDescription("Dataset to search"),
  Options.withDefault("spans")
)

const periodOption = Options.text("period").pipe(
  Options.withDescription("Stats period (e.g., 24h, 7d)"),
  Options.withDefault("24h")
)

export const eventsSearchCommand = Command.make(
  "search",
  {
    org: orgOption,
    project: projectOption,
    query: queryOption,
    dataset: datasetOption,
    period: periodOption,
    limit: limitOption,
  },
  ({ org, project, query, dataset, period, limit }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* requireOrg(org)

      // Default fields based on dataset
      let fields: string[]
      if (dataset === "errors") {
        fields = ["title", "project", "timestamp", "issue", "count()"]
      } else if (dataset === "logs") {
        fields = ["timestamp", "message", "level", "project"]
      } else {
        // spans
        fields = [
          "id",
          "trace",
          "span.op",
          "span.description",
          "span.duration",
          "project",
          "timestamp",
        ]
      }

      const result = yield* api.searchEvents({
        organizationSlug,
        query,
        fields,
        limit,
        projectId: Option.getOrUndefined(project),
        dataset: dataset as "spans" | "errors" | "logs",
        statsPeriod: period,
        sort: "-timestamp",
      })

      const data = result.data

      if (data.length === 0) {
        yield* Console.log("No events found.")
        return
      }

      yield* Console.log(`${dataset} events in ${organizationSlug}:`)
      yield* Console.log("")

      for (const rawEvent of data) {
        // Event data is dynamic based on query fields, so we access it as a record
        const event = rawEvent as Record<string, unknown>
        if (dataset === "errors") {
          yield* Console.log(`  ${event.issue ?? "N/A"}: ${event.title ?? "No title"}`)
          yield* Console.log(`    Project: ${event.project}`)
          yield* Console.log(`    Count: ${event["count()"] ?? 1}`)
          yield* Console.log(`    Time: ${event.timestamp}`)
        } else if (dataset === "logs") {
          yield* Console.log(`  [${event.level ?? "info"}] ${event.message ?? "No message"}`)
          yield* Console.log(`    Project: ${event.project}`)
          yield* Console.log(`    Time: ${event.timestamp}`)
        } else {
          // spans
          yield* Console.log(`  [${event["span.op"] ?? "unknown"}] ${event["span.description"] ?? "No description"}`)
          const duration = event["span.duration"]
          yield* Console.log(`    Duration: ${typeof duration === "number" ? duration.toFixed(2) : "?"}ms`)
          yield* Console.log(`    Trace: ${event.trace}`)
          yield* Console.log(`    Project: ${event.project}`)
          yield* Console.log(`    Time: ${event.timestamp}`)
        }
        yield* Console.log("")
      }

      if (data.length === limit) {
        yield* Console.log(`(Showing ${limit} results. Use --limit to see more.)`)
      }
    })
).pipe(Command.withDescription("Search events"))
