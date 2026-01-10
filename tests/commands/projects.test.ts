/**
 * Projects Command Tests
 *
 * Tests for `sentry projects` commands.
 */

import { Effect } from "effect"
import { describe, expect, it } from "@effect/vitest"
import { runCli, expectCall } from "../helpers/test-cli.js"

describe("sentry projects", () => {
  describe("projects list", () => {
    it.effect("calls listProjects API", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("projects list", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "my-org",
            },
          },
          api: {
            projects: [
              { id: "1", slug: "frontend", name: "Frontend", platform: "javascript" },
              { id: "2", slug: "backend", name: "Backend", platform: "python" },
            ],
          },
        })

        const call = expectCall(calls, "SentryApi", "listProjects")
        const args = call.args as { orgSlug: string }
        expect(args.orgSlug).toBe("my-org")
      })
    )

    it.effect("uses --org flag over default", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("projects list --org custom-org", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "default-org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "listProjects")
        const args = call.args as { orgSlug: string }
        expect(args.orgSlug).toBe("custom-org")
      })
    )

    it.effect("passes query parameter", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("projects list --org org --query front", {
          config: { initialConfig: { accessToken: "token" } },
        })

        const call = expectCall(calls, "SentryApi", "listProjects")
        const args = call.args as { query?: string }
        expect(args.query).toBe("front")
      })
    )
  })

  describe("projects create", () => {
    it.effect("calls createProject API", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("projects create --team engineering MyProject", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "my-org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "createProject")
        const args = call.args as {
          organizationSlug: string
          teamSlug: string
          name: string
        }
        expect(args.organizationSlug).toBe("my-org")
        expect(args.teamSlug).toBe("engineering")
        expect(args.name).toBe("MyProject")
      })
    )

    it.effect("passes platform parameter", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("projects create --team eng --platform javascript NewApp", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "createProject")
        const args = call.args as { platform?: string | null }
        expect(args.platform).toBe("javascript")
      })
    )
  })

  describe("projects update", () => {
    it.effect("calls updateProject API with new name", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("projects update --name NewName my-project", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "my-org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "updateProject")
        const args = call.args as {
          organizationSlug: string
          projectSlug: string
          name?: string | null
        }
        expect(args.organizationSlug).toBe("my-org")
        expect(args.projectSlug).toBe("my-project")
        expect(args.name).toBe("NewName")
      })
    )

    it.effect("updates slug", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("projects update --slug new-slug old-project", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "updateProject")
        const args = call.args as { slug?: string | null }
        expect(args.slug).toBe("new-slug")
      })
    )

    it.effect("updates platform", () =>
      Effect.gen(function* () {
        const { calls } = yield* runCli("projects update --platform python my-project", {
          config: {
            initialConfig: {
              accessToken: "token",
              defaultOrg: "org",
            },
          },
        })

        const call = expectCall(calls, "SentryApi", "updateProject")
        const args = call.args as { platform?: string | null }
        expect(args.platform).toBe("python")
      })
    )
  })
})
