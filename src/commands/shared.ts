/**
 * Shared command options and helpers
 */
import { Options } from "@effect/cli"
import { Effect, Option } from "effect"
import { SentryConfig } from "../config/index.js"
import { ConfigError } from "../errors/index.js"

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
 * Resolve organization from option or config, failing if not available.
 */
export const requireOrg = (orgOption: Option.Option<string>) =>
  Effect.gen(function* () {
    const config = yield* SentryConfig
    const org = Option.getOrUndefined(orgOption) ?? Option.getOrUndefined(config.defaultOrg)
    if (!org) {
      return yield* Effect.fail(
        new ConfigError({ message: "Organization required. Use --org or set defaultOrg in config." })
      )
    }
    return org
  })

/**
 * Resolve project from option or config (optional - returns undefined if not set).
 */
export const resolveProject = (projectOption: Option.Option<string>) =>
  Effect.gen(function* () {
    const config = yield* SentryConfig
    return Option.getOrUndefined(projectOption) ?? Option.getOrUndefined(config.defaultProject)
  })

/**
 * Resolve project from option or config, failing if not available.
 */
export const requireProject = (projectOption: Option.Option<string>) =>
  Effect.gen(function* () {
    const config = yield* SentryConfig
    const project = Option.getOrUndefined(projectOption) ?? Option.getOrUndefined(config.defaultProject)
    if (!project) {
      return yield* Effect.fail(
        new ConfigError({ message: "Project required. Use --project or set defaultProject in config." })
      )
    }
    return project
  })
