import { Args, Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { orgOption } from "../shared.js"

const statusOption = Options.choice("status", [
  "resolved",
  "unresolved",
  "ignored",
]).pipe(
  Options.withAlias("s"),
  Options.withDescription("Set issue status"),
  Options.optional
)

const assignOption = Options.text("assign").pipe(
  Options.withAlias("a"),
  Options.withDescription("Assign to user (username or email)"),
  Options.optional
)

const issueArg = Args.text({ name: "issue-id" }).pipe(
  Args.withDescription("Issue ID (short ID like PROJ-123 or numeric)")
)

export const issuesUpdateCommand = Command.make(
  "update",
  { org: orgOption, status: statusOption, assign: assignOption, issue: issueArg },
  ({ org, status, assign, issue }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()

      const statusValue = Option.getOrUndefined(status)
      const assignValue = Option.getOrUndefined(assign)

      if (!statusValue && !assignValue) {
        yield* Console.error("No updates specified. Use --status or --assign.")
        return
      }

      const updated = yield* api.updateIssue({
        organizationSlug,
        issueId: issue,
        status: statusValue,
        assignedTo: assignValue,
      })

      yield* Console.log(`Updated issue: ${updated.shortId}`)
      yield* Console.log(`  Status: ${updated.status}`)
      if (updated.assignedTo) {
        const assigned =
          typeof updated.assignedTo === "string"
            ? updated.assignedTo
            : updated.assignedTo.name
        yield* Console.log(`  Assigned to: ${assigned}`)
      }
    }).pipe(Effect.provide(OrgService.make(org)))
).pipe(Command.withDescription("Update an issue"))
