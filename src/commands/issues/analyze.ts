import { Args, Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"
import type { AutofixRunStepDefault, AutofixRunStepRootCauseAnalysis } from "../../api/types.js"
import { OrgService } from "../../services/org-service.js"
import { orgOption } from "../shared.js"

const instructionOption = Options.text("instruction").pipe(
  Options.withAlias("i"),
  Options.withDescription("Additional instruction for Seer analysis"),
  Options.optional
)

const issueArg = Args.text({ name: "issue-id" }).pipe(
  Args.withDescription("Issue ID (short ID like PROJ-123 or numeric)")
)

export const issuesAnalyzeCommand = Command.make(
  "analyze",
  { org: orgOption, instruction: instructionOption, issue: issueArg },
  ({ org, instruction, issue }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()

      yield* Console.log(`Starting Seer analysis for issue ${issue}...`)

      // Start the autofix run
      const run = yield* api.startAutofix({
        organizationSlug,
        issueId: issue,
        instruction: Option.getOrUndefined(instruction) ?? "",
      })

      yield* Console.log(`Analysis started. Run ID: ${run.run_id}`)
      yield* Console.log("")

      // Poll for status
      let attempts = 0
      const maxAttempts = 60 // 5 minutes at 5s intervals

      while (attempts < maxAttempts) {
        yield* Effect.sleep("5 seconds")
        attempts++

        const state = yield* api.getAutofixState({
          organizationSlug,
          issueId: issue,
        })

        if (!state.autofix) {
          yield* Console.log("No autofix data available.")
          return
        }

        const status = state.autofix.status
        yield* Console.log(`Status: ${status}`)

        if (
          status === "COMPLETED" ||
          status === "FAILED" ||
          status === "ERROR" ||
          status === "CANCELLED"
        ) {
          // Show results
          yield* Console.log("")
          yield* Console.log("Analysis complete!")

          for (const step of state.autofix.steps) {
            yield* Console.log("")
            yield* Console.log(`Step: ${step.title}`)
            yield* Console.log(`  Status: ${step.status}`)

            if (step.type === "root_cause_analysis") {
              const rootCauseStep = step as AutofixRunStepRootCauseAnalysis
              if (rootCauseStep.causes) {
                yield* Console.log("")
                yield* Console.log("Root Causes:")
                for (const cause of rootCauseStep.causes) {
                  yield* Console.log(`  - ${cause.description}`)
                }
              }
            }

            if (step.type === "default") {
              const defaultStep = step as AutofixRunStepDefault
              if (defaultStep.insights) {
                yield* Console.log("")
                yield* Console.log("Insights:")
                for (const insight of defaultStep.insights) {
                  yield* Console.log(`  - ${insight.insight}`)
                }
              }
            }
          }

          return
        }

        if (status === "WAITING_FOR_USER_RESPONSE") {
          yield* Console.log("")
          yield* Console.log(
            "Analysis requires user input. Please continue in Sentry UI."
          )
          yield* Console.log(api.getIssueUrl(organizationSlug, issue))
          return
        }
      }

      yield* Console.log("")
      yield* Console.log(
        "Analysis is taking longer than expected. Check Sentry UI for results."
      )
      yield* Console.log(api.getIssueUrl(organizationSlug, issue))
    }).pipe(Effect.provide(OrgService.make(org)))
).pipe(Command.withDescription("Analyze issue with Seer AI"))
