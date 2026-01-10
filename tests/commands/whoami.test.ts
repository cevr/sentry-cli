/**
 * Whoami Command Tests
 *
 * Tests for `sentry whoami` command.
 */

import { Effect } from "effect"
import { describe, it } from "@effect/vitest"
import { runCli, expectCall, expectSequence } from "../helpers/test-cli.js"

describe("sentry whoami", () => {
  it.effect("calls getAuthenticatedUser API", () =>
    Effect.gen(function* () {
      const { calls } = yield* runCli("whoami", {
        config: {
          initialConfig: { accessToken: "test-token" },
        },
        api: {
          whoami: { id: "123", name: "Test User", email: "test@example.com" },
        },
      })

      expectCall(calls, "SentryApi", "getAuthenticatedUser")
    })
  )

  it.effect("reads config then calls API", () =>
    Effect.gen(function* () {
      const { calls } = yield* runCli("whoami", {
        config: {
          initialConfig: { accessToken: "token" },
        },
      })

      expectSequence(calls, [
        { service: "ConfigFile", method: "read" },
        { service: "SentryApi", method: "getAuthenticatedUser" },
      ])
    })
  )
})
