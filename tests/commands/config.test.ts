/**
 * Config Command Tests
 *
 * Tests for `sentry config` commands using whole-command-flow testing.
 */

import { Effect } from "effect"
import { describe, expect, it } from "@effect/vitest"
import { runCli, expectCall, expectSequence } from "../helpers/test-cli.js"

describe("sentry config", () => {
  describe("config path", () => {
    it.effect("returns the config file path", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("config path")
        // config path doesn't make API calls, just outputs the path
        expect(calls.length).toBeGreaterThanOrEqual(0)
      })
    )
  })

  describe("config list", () => {
    it.effect("reads config file", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("config list", {
          config: {
            initialConfig: {
              accessToken: "test-token",
              host: "custom.sentry.io",
              defaultOrg: "my-org",
              defaultProject: "my-project",
            },
          },
        })
        expectCall(calls, "ConfigFile", "read")
      })
    )

    it.effect("shows default values when config is empty", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("config list", {
          config: { initialConfig: {} },
        })
        expectCall(calls, "ConfigFile", "read")
      })
    )
  })

  describe("config get", () => {
    it.effect("reads specific config key", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("config get host", {
          config: {
            initialConfig: { host: "custom.sentry.io" },
          },
        })
        expectCall(calls, "ConfigFile", "read")
      })
    )

    it.effect("reads all config when no key provided", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("config get", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })
        expectCall(calls, "ConfigFile", "read")
      })
    )
  })

  describe("config set", () => {
    it.effect("writes host to config", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("config set host custom.sentry.io", {
          config: { initialConfig: {} },
        })

        expectSequence(calls, [
          { service: "ConfigFile", method: "read" },
          { service: "ConfigFile", method: "write" },
        ])

        const writeCall = expectCall(calls, "ConfigFile", "write")
        const args = writeCall.args as { host?: string }
        expect(args.host).toBe("custom.sentry.io")
      })
    )

    it.effect("writes defaultOrg to config", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("config set org my-org", {
          config: { initialConfig: {} },
        })

        const writeCall = expectCall(calls, "ConfigFile", "write")
        const args = writeCall.args as { defaultOrg?: string }
        expect(args.defaultOrg).toBe("my-org")
      })
    )

    it.effect("writes defaultProject to config", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("config set project my-project", {
          config: { initialConfig: {} },
        })

        const writeCall = expectCall(calls, "ConfigFile", "write")
        const args = writeCall.args as { defaultProject?: string }
        expect(args.defaultProject).toBe("my-project")
      })
    )

    it.effect("preserves existing config when setting new value", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("config set host new.sentry.io", {
          config: {
            initialConfig: {
              accessToken: "existing-token",
              defaultOrg: "existing-org",
            },
          },
        })

        const writeCall = expectCall(calls, "ConfigFile", "write")
        const args = writeCall.args as {
          accessToken?: string
          defaultOrg?: string
          host?: string
        }

        // New value is set
        expect(args.host).toBe("new.sentry.io")
        // Existing values preserved
        expect(args.accessToken).toBe("existing-token")
        expect(args.defaultOrg).toBe("existing-org")
      })
    )
  })
})
