import { Context, Effect, Layer, Option, Redacted, Schema } from "effect"
import { FileSystem, Path } from "@effect/platform"
import { ConfigError } from "../errors/index.js"

export const ConfigData = Schema.Struct({
  accessToken: Schema.optional(Schema.String),
  host: Schema.optional(Schema.String),
  defaultOrg: Schema.optional(Schema.String),
  defaultProject: Schema.optional(Schema.String),
})

export type ConfigData = typeof ConfigData.Type

export class ConfigFile extends Context.Tag("@sentry-cli/ConfigFile")<
  ConfigFile,
  {
    readonly read: () => Effect.Effect<ConfigData, ConfigError>
    readonly write: (data: ConfigData) => Effect.Effect<void, ConfigError>
    readonly path: string
  }
>() {
  static readonly layer = Layer.effect(
    ConfigFile,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path
      const home = yield* Effect.sync(() => process.env.HOME || "~")
      const configDir = path.join(home, ".config", "sentry")
      const configPath = path.join(configDir, "config.json")

      const read = Effect.fn("ConfigFile.read")(function* () {
        const exists = yield* fs.exists(configPath).pipe(
          Effect.catchAll(() => Effect.succeed(false))
        )
        if (!exists) {
          return {} as ConfigData
        }

        const content = yield* fs.readFileString(configPath).pipe(
          Effect.catchAll((e) =>
            Effect.fail(
              new ConfigError({
                message: `Failed to read config file: ${configPath}`,
                cause: e,
              })
            )
          )
        )

        const parsed = yield* Effect.try({
          try: () => JSON.parse(content),
          catch: (e) =>
            new ConfigError({
              message: `Failed to parse config file: ${configPath}`,
              cause: e,
            }),
        })

        return yield* Schema.decodeUnknown(ConfigData)(parsed).pipe(
          Effect.catchAll((e) =>
            Effect.fail(
              new ConfigError({
                message: `Invalid config file format: ${configPath}`,
                cause: e,
              })
            )
          )
        )
      })

      const write = Effect.fn("ConfigFile.write")(function* (data: ConfigData) {
        yield* fs.makeDirectory(configDir, { recursive: true }).pipe(
          Effect.catchAll((e) =>
            Effect.fail(
              new ConfigError({
                message: `Failed to create config directory: ${configDir}`,
                cause: e,
              })
            )
          )
        )

        const content = JSON.stringify(data, null, 2)
        yield* fs.writeFileString(configPath, content).pipe(
          Effect.catchAll((e) =>
            Effect.fail(
              new ConfigError({
                message: `Failed to write config file: ${configPath}`,
                cause: e,
              })
            )
          )
        )
      })

      return ConfigFile.of({
        read,
        write,
        path: configPath,
      })
    })
  )
}

export class SentryConfig extends Context.Tag("@sentry-cli/Config")<
  SentryConfig,
  {
    readonly accessToken: Option.Option<Redacted.Redacted<string>>
    readonly host: string
    readonly defaultOrg: Option.Option<string>
    readonly defaultProject: Option.Option<string>
  }
>() {
  static readonly layer = Layer.effect(
    SentryConfig,
    Effect.gen(function* () {
      const configFile = yield* ConfigFile
      const fileConfig = yield* configFile.read().pipe(
        Effect.catchAll(() => Effect.succeed({} as ConfigData))
      )

      const envToken = process.env.SENTRY_ACCESS_TOKEN
      const envHost = process.env.SENTRY_HOST || process.env.SENTRY_URL

      const accessToken = envToken || fileConfig.accessToken
      const host = envHost || fileConfig.host || "sentry.io"
      const defaultOrg = fileConfig.defaultOrg
      const defaultProject = fileConfig.defaultProject

      return SentryConfig.of({
        accessToken: accessToken
          ? Option.some(Redacted.make(accessToken))
          : Option.none(),
        host,
        defaultOrg: defaultOrg ? Option.some(defaultOrg) : Option.none(),
        defaultProject: defaultProject
          ? Option.some(defaultProject)
          : Option.none(),
      })
    })
  )

  static readonly Live = Layer.provide(this.layer, ConfigFile.layer)
}
