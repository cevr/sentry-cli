/**
 * Organizations Command Tests
 *
 * Tests for `sentry orgs` commands.
 */

import { Effect } from "effect"
import { describe, expect, it } from "@effect/vitest"
import { runCli, expectCall } from "../helpers/test-cli.js"

describe("sentry orgs", () => {
  describe("orgs list", () => {
    it.effect("calls listOrganizations API", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("orgs list", {
          config: {
            initialConfig: { accessToken: "token" },
          },
          api: {
            organizations: [
              { slug: "my-org", name: "My Organization" },
              { slug: "other-org", name: "Other Org" },
            ],
          },
        })

        expectCall(calls, "SentryApi", "listOrganizations")
      })
    )

    it.effect("passes query parameter when provided", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("orgs list --query test", {
          config: {
            initialConfig: { accessToken: "token" },
          },
        })

        const call = expectCall(calls, "SentryApi", "listOrganizations")
        const args = call.args as { query?: string }
        expect(args.query).toBe("test")
      })
    )
  })
})
