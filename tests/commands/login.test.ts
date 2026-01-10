/**
 * Login Command Tests
 *
 * Tests for `sentry login` command.
 */

import { Effect } from "effect"
import { describe, expect, it } from "@effect/vitest"
import { runCli, expectCall, expectSequence, expectNoCall } from "../helpers/test-cli.js"

describe("sentry login", () => {
  it.effect("saves token to config file", () =>
    Effect.gen(function* () {
      const { calls } = yield* runCli("login --token test-token-123", {
        config: { initialConfig: {} },
      })

      expectSequence(calls, [
        { service: "ConfigFile", method: "read" },
        { service: "ConfigFile", method: "write" },
      ])

      const writeCall = expectCall(calls, "ConfigFile", "write")
      const args = writeCall.args as { accessToken?: string }
      expect(args.accessToken).toBe("test-token-123")
    })
  )

  it.effect("saves token with host", () =>
    Effect.gen(function* () {
      const { calls } = yield* runCli("login --token my-token --host custom.sentry.io", {
        config: { initialConfig: {} },
      })

      const writeCall = expectCall(calls, "ConfigFile", "write")
      const args = writeCall.args as { accessToken?: string; host?: string }

      expect(args.accessToken).toBe("my-token")
      expect(args.host).toBe("custom.sentry.io")
    })
  )

  it.effect("saves token with default org", () =>
    Effect.gen(function* () {
      const { calls } = yield* runCli("login --token my-token --org my-organization", {
        config: { initialConfig: {} },
      })

      const writeCall = expectCall(calls, "ConfigFile", "write")
      const args = writeCall.args as { accessToken?: string; defaultOrg?: string }

      expect(args.accessToken).toBe("my-token")
      expect(args.defaultOrg).toBe("my-organization")
    })
  )

  it.effect("saves token with default project", () =>
    Effect.gen(function* () {
      const { calls } = yield* runCli("login --token my-token --project my-project", {
        config: { initialConfig: {} },
      })

      const writeCall = expectCall(calls, "ConfigFile", "write")
      const args = writeCall.args as { accessToken?: string; defaultProject?: string }

      expect(args.accessToken).toBe("my-token")
      expect(args.defaultProject).toBe("my-project")
    })
  )

  it.effect("saves all options together", () =>
    Effect.gen(function* () {
      const { calls } = yield* runCli("login --token abc --host h.io --org myorg --project myproj", {
        config: { initialConfig: {} },
      })

      const writeCall = expectCall(calls, "ConfigFile", "write")
      const args = writeCall.args as {
        accessToken?: string
        host?: string
        defaultOrg?: string
        defaultProject?: string
      }

      expect(args.accessToken).toBe("abc")
      expect(args.host).toBe("h.io")
      expect(args.defaultOrg).toBe("myorg")
      expect(args.defaultProject).toBe("myproj")
    })
  )

  it.effect("preserves existing config when adding token", () =>
    Effect.gen(function* () {
      const { calls } = yield* runCli("login --token new-token", {
        config: {
          initialConfig: {
            host: "existing.sentry.io",
            defaultOrg: "existing-org",
          },
        },
      })

      const writeCall = expectCall(calls, "ConfigFile", "write")
      const args = writeCall.args as {
        accessToken?: string
        host?: string
        defaultOrg?: string
      }

      expect(args.accessToken).toBe("new-token")
      // Existing values should be preserved
      expect(args.host).toBe("existing.sentry.io")
      expect(args.defaultOrg).toBe("existing-org")
    })
  )

  it.effect("does not write config when no token provided", () =>
    Effect.gen(function* () {
      const { calls } = yield* runCli("login", {
        config: { initialConfig: {} },
      })

      // Should not write when no token is provided
      expectNoCall(calls, "ConfigFile", "write")
    })
  )
})
