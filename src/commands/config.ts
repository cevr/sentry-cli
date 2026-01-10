import { Args, Command } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { ConfigFile, type ConfigData } from "../config/index.js"

const keyArg = Args.text({ name: "key" }).pipe(
  Args.withDescription("Configuration key to get/set"),
  Args.optional
)

const configGetCommand = Command.make("get", { key: keyArg }, ({ key }) =>
  Effect.gen(function* () {
    const configFile = yield* ConfigFile
    const config = yield* configFile.read()

    if (Option.isNone(key)) {
      // Show all config
      yield* Console.log("Current configuration:")
      yield* Console.log(`  accessToken: ${config.accessToken ? "***" : "(not set)"}`)
      yield* Console.log(`  host: ${config.host ?? "sentry.io"}`)
      yield* Console.log(`  defaultOrg: ${config.defaultOrg ?? "(not set)"}`)
      yield* Console.log(`  defaultProject: ${config.defaultProject ?? "(not set)"}`)
      yield* Console.log("")
      yield* Console.log(`Config file: ${configFile.path}`)
      return
    }

    const k = Option.getOrElse(key, () => "")
    switch (k) {
      case "accessToken":
      case "token":
        yield* Console.log(config.accessToken ? "***" : "(not set)")
        break
      case "host":
        yield* Console.log(config.host ?? "sentry.io")
        break
      case "defaultOrg":
      case "org":
        yield* Console.log(config.defaultOrg ?? "(not set)")
        break
      case "defaultProject":
      case "project":
        yield* Console.log(config.defaultProject ?? "(not set)")
        break
      default:
        yield* Console.error(`Unknown config key: ${k}`)
        yield* Console.log("Valid keys: accessToken, host, defaultOrg, defaultProject")
    }
  })
).pipe(Command.withDescription("Get configuration value(s)"))

const configSetCommand = Command.make(
  "set",
  { key: Args.text({ name: "key" }), value: Args.text({ name: "value" }) },
  ({ key, value }) =>
    Effect.gen(function* () {
      const configFile = yield* ConfigFile
      const existingConfig = yield* configFile.read().pipe(
        Effect.catchAll(() => Effect.succeed({} as ConfigData))
      )

      let newConfig: ConfigData
      switch (key) {
        case "accessToken":
        case "token":
          newConfig = { ...existingConfig, accessToken: value }
          break
        case "host":
          newConfig = { ...existingConfig, host: value }
          break
        case "defaultOrg":
        case "org":
          newConfig = { ...existingConfig, defaultOrg: value }
          break
        case "defaultProject":
        case "project":
          newConfig = { ...existingConfig, defaultProject: value }
          break
        default:
          yield* Console.error(`Unknown config key: ${key}`)
          yield* Console.log("Valid keys: accessToken, host, defaultOrg, defaultProject")
          return
      }

      yield* configFile.write(newConfig)
      yield* Console.log(`Set ${key} = ${key.includes("oken") ? "***" : value}`)
    })
).pipe(Command.withDescription("Set a configuration value"))

const configListCommand = Command.make("list", {}, () =>
  Effect.gen(function* () {
    const configFile = yield* ConfigFile
    const config = yield* configFile.read()

    yield* Console.log("Configuration:")
    yield* Console.log(`  accessToken: ${config.accessToken ? "***" : "(not set)"}`)
    yield* Console.log(`  host: ${config.host ?? "sentry.io"}`)
    yield* Console.log(`  defaultOrg: ${config.defaultOrg ?? "(not set)"}`)
    yield* Console.log(`  defaultProject: ${config.defaultProject ?? "(not set)"}`)
    yield* Console.log("")
    yield* Console.log(`Config file: ${configFile.path}`)
  })
).pipe(Command.withDescription("List all configuration"))

const configPathCommand = Command.make("path", {}, () =>
  Effect.gen(function* () {
    const configFile = yield* ConfigFile
    yield* Console.log(configFile.path)
  })
).pipe(Command.withDescription("Show config file path"))

export const configCommand = Command.make("config", {}).pipe(
  Command.withSubcommands([
    configGetCommand,
    configSetCommand,
    configListCommand,
    configPathCommand,
  ]),
  Command.withDescription("Manage CLI configuration")
)
