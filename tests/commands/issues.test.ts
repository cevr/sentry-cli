/**
 * Issues Command Tests
 *
 * Tests for `sentry issues` commands.
 */

import { Effect } from "effect"
import { describe, expect, it } from "@effect/vitest"
import { runCli, expectCall, expectSequence } from "../helpers/test-cli.js"

describe("sentry issues", () => {
  describe("issues search", () => {
    it.effect("calls listIssues API", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues search", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "my-org",
            },
          },
          api: {
            issues: [
              {
                id: "1",
                shortId: "PROJ-1",
                title: "Test Error",
                status: "unresolved",
                count: "5",
                firstSeen: "2024-01-01T00:00:00Z",
                lastSeen: "2024-01-02T00:00:00Z",
              },
            ],
          },
        })

        const call = expectCall(calls, "SentryApi", "listIssues")
        const args = call.args as { organizationSlug: string }
        expect(args.organizationSlug).toBe("my-org")
      })
    )

    it.effect("passes query parameter", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues search --query is:unresolved", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "listIssues")
        const args = call.args as { query?: string }
        expect(args.query).toBe("is:unresolved")
      })
    )

    it.effect("passes project parameter", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues search --project my-project", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "listIssues")
        const args = call.args as { projectSlug?: string }
        expect(args.projectSlug).toBe("my-project")
      })
    )

    it.effect("passes sort parameter", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues search --sort freq", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "listIssues")
        const args = call.args as { sortBy?: string }
        expect(args.sortBy).toBe("freq")
      })
    )

    it.effect("passes limit parameter", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues search --limit 5", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "listIssues")
        const args = call.args as { limit?: number }
        expect(args.limit).toBe(5)
      })
    )
  })

  describe("issues get", () => {
    it.effect("calls getIssue API", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues get PROJ-123", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "my-org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "getIssue")
        const args = call.args as { organizationSlug: string; issueId: string }
        expect(args.organizationSlug).toBe("my-org")
        expect(args.issueId).toBe("PROJ-123")
      })
    )

    it.effect("uses --org flag", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues get --org custom-org ISSUE-1", {
          config: {
            initialConfig: { accessToken: "token" },
          },
        })

        const call = expectCall(calls, "SentryApi", "getIssue")
        const args = call.args as { organizationSlug: string }
        expect(args.organizationSlug).toBe("custom-org")
      })
    )
  })

  describe("issues update", () => {
    it.effect("calls updateIssue API with status", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues update --status resolved PROJ-123", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "my-org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "updateIssue")
        const args = call.args as {
          organizationSlug: string
          issueId: string
          status?: string
        }
        expect(args.organizationSlug).toBe("my-org")
        expect(args.issueId).toBe("PROJ-123")
        expect(args.status).toBe("resolved")
      })
    )

    it.effect("calls updateIssue API with assignee", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues update --assign user@example.com PROJ-456", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "updateIssue")
        const args = call.args as { assignedTo?: string }
        expect(args.assignedTo).toBe("user@example.com")
      })
    )

    it.effect("updates both status and assignee", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues update --status ignored --assign me PROJ-789", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "updateIssue")
        const args = call.args as { status?: string; assignedTo?: string }
        expect(args.status).toBe("ignored")
        expect(args.assignedTo).toBe("me")
      })
    )
  })

  describe("issues analyze", () => {
    it.effect("calls startAutofix API", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues analyze PROJ-123", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "my-org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "startAutofix")
        const args = call.args as { organizationSlug: string; issueId: string }
        expect(args.organizationSlug).toBe("my-org")
        expect(args.issueId).toBe("PROJ-123")
      })
    )

    it.effect("then polls getAutofixState", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("issues analyze PROJ-456", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })

        expectSequence(calls, [
          { service: "SentryApi", method: "startAutofix" },
          { service: "SentryApi", method: "getAutofixState" },
        ])
      })
    )
  })
})
