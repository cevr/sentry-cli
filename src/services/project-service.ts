/**
 * Project resolution service.
 * Resolves project from CLI option → config → interactive prompt.
 * Depends on OrgService to get the organization first.
 * Caches the result for subsequent calls within the same command.
 */
import { Prompt } from "@effect/cli"
import { Terminal } from "@effect/platform"
import { Context, Effect, Layer, Option, Ref } from "effect"
import { SentryApi } from "../api/client.js"
import { SentryConfig } from "../config/index.js"
import { ApiError, ApiValidationError, ConfigError } from "../errors/index.js"
import { OrgService } from "./org-service.js"

export class ProjectService extends Context.Tag("@sentry-cli/ProjectService")<
  ProjectService,
  {
    readonly get: () => Effect.Effect<string, ConfigError | ApiError | ApiValidationError | Terminal.QuitException, Terminal.Terminal>
  }
>() {
  /**
   * Create a live implementation that prompts when project is not found.
   * @param projectOption - The --project option value from CLI
   */
  static make = (projectOption: Option.Option<string>) =>
    Layer.effect(
      ProjectService,
      Effect.gen(function* () {
        const config = yield* SentryConfig
        const api = yield* SentryApi
        const orgService = yield* OrgService
        const cache = yield* Ref.make<Option.Option<string>>(Option.none())

        return ProjectService.of({
          get: () =>
            Effect.gen(function* () {
              // Check cache first
              const cached = yield* Ref.get(cache)
              if (Option.isSome(cached)) return cached.value

              // Check option, then config
              const fromOption = Option.getOrUndefined(projectOption)
              if (fromOption) {
                yield* Ref.set(cache, Option.some(fromOption))
                return fromOption
              }

              const fromConfig = Option.getOrUndefined(config.defaultProject)
              if (fromConfig) {
                yield* Ref.set(cache, Option.some(fromConfig))
                return fromConfig
              }

              // Check if we're in an interactive terminal
              if (!process.stdout.isTTY) {
                return yield* Effect.fail(
                  new ConfigError({
                    message: "Project required. Use --project or set defaultProject in config.",
                  })
                )
              }

              // Get org first, then fetch projects
              const org = yield* orgService.get()
              const projects = yield* api.listProjects(org)
              if (projects.length === 0) {
                return yield* Effect.fail(
                  new ConfigError({
                    message: `No projects found in organization '${org}'.`,
                  })
                )
              }

              // Auto-select if only one project
              if (projects.length === 1) {
                yield* Ref.set(cache, Option.some(projects[0].slug))
                return projects[0].slug
              }

              const selected = yield* Prompt.select({
                message: "Select project",
                choices: projects.map((p) => ({ title: p.name, value: p.slug })),
              })
              yield* Ref.set(cache, Option.some(selected))
              return selected
            }),
        })
      })
    )

  /**
   * Test implementation that returns a fixed project without prompting.
   */
  static test = (project: string) =>
    Layer.succeed(
      ProjectService,
      ProjectService.of({
        get: () => Effect.succeed(project),
      })
    )
}
