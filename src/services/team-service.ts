/**
 * Team resolution service.
 * Resolves team from CLI option → interactive prompt.
 * Depends on OrgService to get the organization first.
 * Caches the result for subsequent calls within the same command.
 */
import { Prompt } from "@effect/cli"
import { Terminal } from "@effect/platform"
import { Context, Effect, Layer, Option, Ref } from "effect"
import { SentryApi } from "../api/client.js"
import { ApiError, ApiValidationError, ConfigError } from "../errors/index.js"
import { OrgService } from "./org-service.js"

export class TeamService extends Context.Tag("@cvr/sentry/services/team-service/TeamService")<
  TeamService,
  {
    readonly get: () => Effect.Effect<string, ConfigError | ApiError | ApiValidationError | Terminal.QuitException, Terminal.Terminal>
  }
>() {
  /**
   * Create a live implementation that prompts when team is not found.
   * @param teamOption - The --team option value from CLI
   */
  static make = (teamOption: Option.Option<string>) =>
    Layer.effect(
      TeamService,
      Effect.gen(function* () {
        const api = yield* SentryApi
        const orgService = yield* OrgService
        const cache = yield* Ref.make<Option.Option<string>>(Option.none())

        return TeamService.of({
          get: () =>
            Effect.gen(function* () {
              // Check cache first
              const cached = yield* Ref.get(cache)
              if (Option.isSome(cached)) return cached.value

              // Check option
              const fromOption = Option.getOrUndefined(teamOption)
              if (fromOption !== undefined) {
                yield* Ref.set(cache, Option.some(fromOption))
                return fromOption
              }

              // Check if we're in an interactive terminal
              if (!process.stdout.isTTY) {
                return yield* new ConfigError({
                  message: "Team required. Use --team to specify a team.",
                })
              }

              // Get org first, then fetch teams
              const org = yield* orgService.get()
              const teams = yield* api.listTeams(org)
              if (teams.length === 0) {
                return yield* new ConfigError({
                  message: `No teams found in organization '${org}'.`,
                })
              }

              // Auto-select if only one team
              if (teams.length === 1) {
                yield* Ref.set(cache, Option.some(teams[0].slug))
                return teams[0].slug
              }

              const selected = yield* Prompt.select({
                message: "Select team",
                choices: teams.map((t) => ({ title: t.name, value: t.slug })),
              })
              yield* Ref.set(cache, Option.some(selected))
              return selected
            }),
        })
      })
    )

  /**
   * Test implementation that returns a fixed team without prompting.
   */
  static test = (team: string) =>
    Layer.succeed(
      TeamService,
      TeamService.of({
        get: () => Effect.succeed(team),
      })
    )
}
