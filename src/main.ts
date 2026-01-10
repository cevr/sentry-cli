import { Command } from "@effect/cli"
import { BunContext } from "@effect/platform-bun"
import { Console, Effect, Layer } from "effect"

import { ConfigFile, SentryConfig } from "./config/index.js"
import { SentryApi } from "./api/client.js"

// Commands
import { whoamiCommand } from "./commands/whoami.js"
import { loginCommand } from "./commands/login.js"
import { configCommand } from "./commands/config.js"
import { orgsCommand } from "./commands/orgs/index.js"
import { teamsCommand } from "./commands/teams/index.js"
import { projectsCommand } from "./commands/projects/index.js"
import { issuesCommand } from "./commands/issues/index.js"
import { tracesCommand } from "./commands/traces/index.js"
import { eventsCommand } from "./commands/events/index.js"
import { dsnsCommand } from "./commands/dsns/index.js"
import { releasesCommand } from "./commands/releases/index.js"
import { docsCommand } from "./commands/docs/index.js"

const sentryCommand = Command.make("sentry", {}).pipe(
  Command.withSubcommands([
    whoamiCommand,
    loginCommand,
    configCommand,
    orgsCommand,
    teamsCommand,
    projectsCommand,
    issuesCommand,
    tracesCommand,
    eventsCommand,
    dsnsCommand,
    releasesCommand,
    docsCommand,
  ]),
  Command.withDescription("Sentry CLI - Interact with Sentry from the command line")
)

export const cli = Command.run(sentryCommand, {
  name: "sentry",
  version: "0.1.0",
})

// Build the layers
const PlatformLayer = BunContext.layer

const ConfigFileLayer = Layer.provide(ConfigFile.layer, PlatformLayer)

const SentryConfigLayer = Layer.provide(SentryConfig.layer, ConfigFileLayer)

const ApiLayer = Layer.provide(SentryApi.layer, SentryConfigLayer)

export const MainLayer = Layer.mergeAll(
  PlatformLayer,
  ConfigFileLayer,
  SentryConfigLayer,
  ApiLayer
)

/**
 * Handle errors from CLI execution
 */
const handleError = (error: unknown): Effect.Effect<void> =>
  Effect.gen(function* () {
    if (typeof error === "object" && error !== null && "_tag" in error) {
      const tagged = error as { _tag: string; message?: string; status?: number; details?: unknown }
      switch (tagged._tag) {
        case "ApiError":
          yield* Console.error(`Error: ${tagged.message}`)
          if (tagged.status) {
            yield* Console.error(`Status: ${tagged.status}`)
          }
          return
        case "ConfigError":
          yield* Console.error(`Config error: ${tagged.message}`)
          return
        case "AuthError":
          yield* Console.error(`Auth error: ${tagged.message}`)
          yield* Console.error("Run 'sentry login' to configure authentication.")
          return
        case "ApiValidationError":
          yield* Console.error(`Validation error: ${tagged.message}`)
          if (tagged.details) {
            yield* Console.error(`Details: ${JSON.stringify(tagged.details)}`)
          }
          return
      }
    }
    // For CLI validation errors and other errors
    yield* Console.error(`${String(error)}`)
  })

export const runCli = (args: ReadonlyArray<string>) =>
  cli(args).pipe(
    Effect.catchAll(handleError),
    Effect.provide(MainLayer)
  )
