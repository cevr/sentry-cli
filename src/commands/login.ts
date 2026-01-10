import { Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { ConfigFile, type ConfigData } from "../config/index.js"
import { TokenProvider } from "../services/token-provider.js"

const tokenOption = Options.text("token").pipe(
  Options.withAlias("t"),
  Options.withDescription("Sentry access token"),
  Options.optional
)

const hostOption = Options.text("host").pipe(
  Options.withAlias("h"),
  Options.withDescription("Sentry host (default: sentry.io)"),
  Options.optional
)

const orgOption = Options.text("org").pipe(
  Options.withAlias("o"),
  Options.withDescription("Default organization slug"),
  Options.optional
)

const projectOption = Options.text("project").pipe(
  Options.withAlias("p"),
  Options.withDescription("Default project slug"),
  Options.optional
)

export const loginCommand = Command.make(
  "login",
  { token: tokenOption, host: hostOption, org: orgOption, project: projectOption },
  ({ token, host, org, project }) =>
    Effect.gen(function* () {
      const configFile = yield* ConfigFile

      // Read existing config
      const existingConfig = yield* configFile.read().pipe(
        Effect.catchAll(() => Effect.succeed({} as ConfigData))
      )

      // If no token provided, prompt for one
      let accessToken = Option.getOrUndefined(token)
      if (!accessToken) {
        const tokenProvider = yield* TokenProvider
        accessToken = yield* tokenProvider.promptForToken()

        if (!accessToken) {
          yield* Console.log("No token provided. Aborting.")
          return
        }
      }

      // Update config
      const hostValue = Option.getOrUndefined(host)
      const orgValue = Option.getOrUndefined(org)
      const projectValue = Option.getOrUndefined(project)

      const newConfig: ConfigData = {
        ...existingConfig,
        accessToken,
        ...(hostValue ? { host: hostValue } : {}),
        ...(orgValue ? { defaultOrg: orgValue } : {}),
        ...(projectValue ? { defaultProject: projectValue } : {}),
      }

      yield* configFile.write(newConfig)
      yield* Console.log(`Configuration saved to ${configFile.path}`)
      yield* Console.log("Token saved successfully!")

      if (hostValue) {
        yield* Console.log(`Host: ${hostValue}`)
      }
      if (orgValue) {
        yield* Console.log(`Default org: ${orgValue}`)
      }
      if (projectValue) {
        yield* Console.log(`Default project: ${projectValue}`)
      }
    })
).pipe(Command.withDescription("Configure Sentry authentication"))
