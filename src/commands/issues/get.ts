import { Args, Command } from "@effect/cli"
import { Console, Effect } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { orgOption } from "../shared.js"

const issueArg = Args.text({ name: "issue-id" }).pipe(
  Args.withDescription("Issue ID (short ID like PROJ-123 or numeric)")
)

export const issuesGetCommand = Command.make(
  "get",
  { org: orgOption, issue: issueArg },
  ({ org, issue }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()

      const issueData = yield* api.getIssue({
        organizationSlug,
        issueId: issue,
      })

      yield* Console.log(`Issue: ${issueData.shortId}`)
      yield* Console.log(`Title: ${issueData.title}`)
      yield* Console.log("")
      yield* Console.log(`Status: ${issueData.status}`)
      if (issueData.substatus) {
        yield* Console.log(`Substatus: ${issueData.substatus}`)
      }
      yield* Console.log(`Type: ${issueData.type}`)
      yield* Console.log(`Project: ${issueData.project.slug}`)
      yield* Console.log("")
      yield* Console.log(`Events: ${issueData.count}`)
      yield* Console.log(`Users affected: ${issueData.userCount}`)
      yield* Console.log(`First seen: ${issueData.firstSeen}`)
      yield* Console.log(`Last seen: ${issueData.lastSeen}`)
      yield* Console.log("")
      yield* Console.log(`Culprit: ${issueData.culprit}`)

      if (issueData.assignedTo) {
        const assigned =
          typeof issueData.assignedTo === "string"
            ? issueData.assignedTo
            : issueData.assignedTo.name
        yield* Console.log(`Assigned to: ${assigned}`)
      }

      yield* Console.log("")
      yield* Console.log(`URL: ${issueData.permalink}`)

      // Try to get the latest event for stack trace
      const event = yield* api.getLatestEventForIssue({
        organizationSlug,
        issueId: issue,
      }).pipe(Effect.catchAll(() => Effect.succeed(null)))

      if (event) {
        yield* Console.log("")
        yield* Console.log("Latest Event:")
        yield* Console.log(`  ID: ${event.id}`)
        yield* Console.log(`  Platform: ${event.platform ?? "unknown"}`)

        // Extract exception info if available
        const exceptionEntry = event.entries.find(
          (e) => e.type === "exception"
        )
        if (exceptionEntry && exceptionEntry.type === "exception") {
          const data = exceptionEntry.data as { values?: Array<{ type?: string | null; value?: string | null; stacktrace?: { frames?: Array<{ filename?: string | null; absPath?: string | null; function?: string | null; lineNo?: number | null }> } }> }
          const values = data?.values || []
          const firstException = values[0]
          if (firstException) {
            yield* Console.log("")
            yield* Console.log("Exception:")
            yield* Console.log(`  Type: ${firstException.type ?? "Unknown"}`)
            yield* Console.log(`  Value: ${firstException.value ?? ""}`)

            // Show top frames of stack trace
            const frames = firstException.stacktrace?.frames || []
            if (frames.length > 0) {
              yield* Console.log("")
              yield* Console.log("Stack trace (top frames):")
              const topFrames = frames.slice(-5).reverse()
              for (const frame of topFrames) {
                const file = frame.filename || frame.absPath || "unknown"
                const func = frame.function || "<anonymous>"
                const line = frame.lineNo ?? "?"
                yield* Console.log(`    at ${func} (${file}:${line})`)
              }
            }
          }
        }
      }
    }).pipe(Effect.provide(OrgService.make(org)))
).pipe(Command.withDescription("Get issue details"))
