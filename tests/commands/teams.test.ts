/**
 * Teams Command Tests
 *
 * Tests for `sentry teams` commands.
 */

import { Effect } from "effect"
import { describe, expect, it } from "@effect/vitest"
import { runCli, expectCall } from "../helpers/test-cli.js"

describe("sentry teams", () => {
  describe("teams list", () => {
    it.effect("calls listTeams API with org from config", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("teams list", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "my-org",
            },
          },
          api: {
            teams: [
              { id: "1", slug: "engineering", name: "Engineering" },
              { id: "2", slug: "design", name: "Design" },
            ],
          },
        })

        const call = expectCall(calls, "SentryApi", "listTeams")
        const args = call.args as { orgSlug: string }
        expect(args.orgSlug).toBe("my-org")
      })
    )

    it.effect("uses --org flag over config default", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("teams list --org override-org", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "default-org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "listTeams")
        const args = call.args as { orgSlug: string }
        expect(args.orgSlug).toBe("override-org")
      })
    )

    it.effect("passes query parameter", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("teams list --org org --query eng", {
          config: { initialConfig: { accessToken: "token" } },
        })

        const call = expectCall(calls, "SentryApi", "listTeams")
        const args = call.args as { query?: string }
        expect(args.query).toBe("eng")
      })
    )
  })

  describe("teams create", () => {
    it.effect("calls createTeam API with name", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("teams create Engineering", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "my-org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "createTeam")
        const args = call.args as { organizationSlug: string; name: string }
        expect(args.organizationSlug).toBe("my-org")
        expect(args.name).toBe("Engineering")
      })
    )

    it.effect("uses --org flag for organization", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("teams create --org custom-org NewTeam", {
          config: { initialConfig: { accessToken: "token" } },
        })

        const call = expectCall(calls, "SentryApi", "createTeam")
        const args = call.args as { organizationSlug: string; name: string }
        expect(args.organizationSlug).toBe("custom-org")
        expect(args.name).toBe("NewTeam")
      })
    )
  })
})
