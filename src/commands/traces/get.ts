import { Args, Command, Options } from "@effect/cli"
import { Console, Effect } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { orgOption } from "../shared.js"

const limitOption = Options.integer("limit").pipe(
  Options.withAlias("l"),
  Options.withDescription("Maximum number of spans to show"),
  Options.withDefault(50)
)

const traceArg = Args.text({ name: "trace-id" }).pipe(
  Args.withDescription("Trace ID (32-character hex string)")
)

export const tracesGetCommand = Command.make(
  "get",
  { org: orgOption, limit: limitOption, trace: traceArg },
  ({ org, limit, trace }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()

      // Get trace metadata
      const meta = yield* api.getTraceMeta({
        organizationSlug,
        traceId: trace,
      })

      yield* Console.log(`Trace: ${trace}`)
      yield* Console.log("")
      yield* Console.log("Summary:")
      yield* Console.log(`  Total spans: ${meta.span_count}`)
      yield* Console.log(`  Errors: ${meta.errors}`)
      yield* Console.log(`  Performance issues: ${meta.performance_issues}`)
      yield* Console.log(`  Logs: ${meta.logs}`)
      yield* Console.log("")

      // Show operation breakdown
      const ops = Object.entries(meta.span_count_map)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)

      if (ops.length > 0) {
        yield* Console.log("Operations:")
        for (const [op, count] of ops) {
          yield* Console.log(`  ${op}: ${count}`)
        }
        yield* Console.log("")
      }

      // Get trace spans
      const traceData = yield* api.getTrace({
        organizationSlug: organizationSlug,
        traceId: trace,
        limit,
      })

      yield* Console.log("Trace URL:")
      yield* Console.log(`  ${api.getTraceUrl(organizationSlug, trace)}`)
      yield* Console.log("")

      // Show span tree (simplified)
      if (traceData.length > 0) {
        yield* Console.log(`Spans (showing up to ${limit}):`)
        yield* Console.log("")

        const printSpan = (span: any, depth: number): Effect.Effect<void> =>
          Effect.gen(function* () {
            if (!span.is_transaction && depth > 3) return // Limit depth for readability

            const indent = "  ".repeat(depth)
            const duration = span.duration ? `${span.duration.toFixed(2)}ms` : "?"

            if (span.is_transaction) {
              yield* Console.log(
                `${indent}[${span.op}] ${span.transaction || span.description} (${duration})`
              )
            } else {
              yield* Console.log(
                `${indent}[${span.op}] ${span.description || span.name} (${duration})`
              )
            }

            if (span.errors?.length > 0) {
              yield* Console.log(`${indent}  Errors: ${span.errors.length}`)
            }

            // Process children (limit to avoid overwhelming output)
            const children = span.children?.slice(0, 10) || []
            for (const child of children) {
              yield* printSpan(child, depth + 1)
            }

            if (span.children?.length > 10) {
              yield* Console.log(
                `${indent}  ... and ${span.children.length - 10} more children`
              )
            }
          })

        for (const rootSpan of traceData.slice(0, 5)) {
          // Check if it's a span (has is_transaction) vs an issue
          if ("is_transaction" in rootSpan) {
            yield* printSpan(rootSpan, 0)
          } else {
            // It's an issue object
            yield* Console.log(`[issue] ${rootSpan.title || "Unknown issue"}`)
            if (rootSpan.culprit) {
              yield* Console.log(`  Culprit: ${rootSpan.culprit}`)
            }
          }
          yield* Console.log("")
        }

        if (traceData.length > 5) {
          yield* Console.log(`... and ${traceData.length - 5} more root items`)
        }
      }
    }).pipe(Effect.provide(OrgService.make(org)))
).pipe(Command.withDescription("Get trace details"))
