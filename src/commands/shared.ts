/**
 * Shared command options and helpers
 */
import { Options } from "@effect/cli"
import { Effect, Option } from "effect"
import { SentryConfig } from "../config/index.js"

// ============================================================================
// Common Options
// ============================================================================

export const orgOption = Options.text("org").pipe(
  Options.withAlias("o"),
  Options.withDescription("Organization slug"),
  Options.optional
)

export const projectOption = Options.text("project").pipe(
  Options.withAlias("p"),
  Options.withDescription("Project slug"),
  Options.optional
)

export const teamOption = Options.text("team").pipe(
  Options.withAlias("t"),
  Options.withDescription("Team slug"),
  Options.optional
)

export const queryOption = Options.text("query").pipe(
  Options.withAlias("q"),
  Options.withDescription("Search query"),
  Options.optional
)

export const limitOption = Options.integer("limit").pipe(
  Options.withAlias("l"),
  Options.withDescription("Maximum number of results"),
  Options.withDefault(10)
)

// ============================================================================
// Helpers
// ============================================================================

/**
 * Resolve project from option or config (optional - returns undefined if not set).
 * Use this when project is optional. For required project, use ProjectService.
 */
export const resolveProject = (projectOption: Option.Option<string>) =>
  Effect.gen(function* () {
    const config = yield* SentryConfig
    return Option.getOrUndefined(projectOption) ?? Option.getOrUndefined(config.defaultProject)
  })
