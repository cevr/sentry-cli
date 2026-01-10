/**
 * Organization resolution service.
 * Resolves org from CLI option → config → interactive prompt.
 * Caches the result for subsequent calls within the same command.
 */
import { Prompt } from "@effect/cli"
import { Terminal } from "@effect/platform"
import { Context, Effect, Layer, Option, Ref } from "effect"
import { SentryApi } from "../api/client.js"
import { SentryConfig } from "../config/index.js"
import { ApiError, ConfigError } from "../errors/index.js"

export class OrgService extends Context.Tag("@sentry-cli/OrgService")<
  OrgService,
  {
    readonly get: () => Effect.Effect<string, ConfigError | ApiError | Terminal.QuitException, Terminal.Terminal>
  }
>() {
  /**
   * Create a live implementation that prompts when org is not found.
   * @param orgOption - The --org option value from CLI
   */
  static make = (orgOption: Option.Option<string>) =>
    Layer.effect(
      OrgService,
      Effect.gen(function* () {
        const config = yield* SentryConfig
        const api = yield* SentryApi
        const cache = yield* Ref.make<Option.Option<string>>(Option.none())

        return OrgService.of({
          get: () =>
            Effect.gen(function* () {
              // Check cache first
              const cached = yield* Ref.get(cache)
              if (Option.isSome(cached)) return cached.value

              // Check option, then config
              const fromOption = Option.getOrUndefined(orgOption)
              if (fromOption) {
                yield* Ref.set(cache, Option.some(fromOption))
                return fromOption
              }

              const fromConfig = Option.getOrUndefined(config.defaultOrg)
              if (fromConfig) {
                yield* Ref.set(cache, Option.some(fromConfig))
                return fromConfig
              }

              // Check if we're in an interactive terminal
              if (!process.stdout.isTTY) {
                return yield* Effect.fail(
                  new ConfigError({
                    message: "Organization required. Use --org or set defaultOrg in config.",
                  })
                )
              }

              // Fetch orgs and prompt
              const orgs = yield* api.listOrganizations()
              if (orgs.length === 0) {
                return yield* Effect.fail(
                  new ConfigError({ message: "No organizations found for this account." })
                )
              }

              // Auto-select if only one org
              if (orgs.length === 1) {
                yield* Ref.set(cache, Option.some(orgs[0].slug))
                return orgs[0].slug
              }

              const selected = yield* Prompt.select({
                message: "Select organization",
                choices: orgs.map((o) => ({ title: o.name, value: o.slug })),
              })
              yield* Ref.set(cache, Option.some(selected))
              return selected
            }),
        })
      })
    )

  /**
   * Test implementation that returns a fixed org without prompting.
   */
  static test = (org: string) =>
    Layer.succeed(
      OrgService,
      OrgService.of({
        get: () => Effect.succeed(org),
      })
    )
}
