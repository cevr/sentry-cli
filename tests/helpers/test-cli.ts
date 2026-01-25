/**
 * CLI Test Infrastructure
 *
 * Goal: Test whole command flows, not individual pieces.
 * - Execute actual commands with real argument parsing
 * - Provide mock layers for external dependencies
 * - Assert on the sequence of observable side effects
 */

import { Context, Effect, Fiber, Layer, Option, Redacted, Ref, TestClock, TestContext } from "effect"
import { BunContext } from "@effect/platform-bun"
import { ConfigFile, SentryConfig, type ConfigData } from "../../src/config/index.js"
import { SentryApi } from "../../src/api/client.js"
import { ApiError } from "../../src/errors/index.js"
import { Browser } from "../../src/services/browser.js"
import { TokenProvider } from "../../src/services/token-provider.js"
import { OrgService } from "../../src/services/org-service.js"
import { ProjectService } from "../../src/services/project-service.js"
import { TeamService } from "../../src/services/team-service.js"
import type { User, EventsResponse } from "../../src/api/schema.js"
import { cli } from "../../src/main.js"

// Extract the SentryApi service interface type
type SentryApiService = Context.Tag.Service<typeof SentryApi>

// ============================================================================
// Call Recording
// ============================================================================

export interface ServiceCall {
  service: string
  method: string
  args?: unknown
  result?: unknown
}

export class CallRecorder extends Context.Tag("@test/CallRecorder")<
  CallRecorder,
  {
    readonly record: (call: ServiceCall) => Effect.Effect<void>
    readonly calls: Effect.Effect<ReadonlyArray<ServiceCall>>
    readonly clear: Effect.Effect<void>
  }
>() {
  static readonly layer = Layer.effect(
    CallRecorder,
    Effect.gen(function* () {
      const ref = yield* Ref.make<ServiceCall[]>([])

      return CallRecorder.of({
        record: (call) => Ref.update(ref, (calls) => [...calls, call]),
        calls: Ref.get(ref),
        clear: Ref.set(ref, []),
      })
    })
  )
}

// ============================================================================
// Console Capture
// ============================================================================

export class ConsoleOutput extends Context.Tag("@test/ConsoleOutput")<
  ConsoleOutput,
  {
    readonly stdout: Ref.Ref<string[]>
    readonly stderr: Ref.Ref<string[]>
  }
>() {
  static readonly layer = Layer.effect(
    ConsoleOutput,
    Effect.gen(function* () {
      const stdout = yield* Ref.make<string[]>([])
      const stderr = yield* Ref.make<string[]>([])
      return ConsoleOutput.of({ stdout, stderr })
    })
  )
}

// ============================================================================
// Mock ConfigFile Service
// ============================================================================

export interface MockConfigFileOptions {
  initialConfig?: ConfigData
}

export const createMockConfigFile = (options: MockConfigFileOptions = {}) =>
  Layer.effect(
    ConfigFile,
    Effect.gen(function* () {
      const recorder = yield* CallRecorder
      const configRef = yield* Ref.make<ConfigData>(options.initialConfig ?? {})

      return ConfigFile.of({
        path: "/mock/.config/sentry/config.json",
        read: () =>
          Effect.gen(function* () {
            const config = yield* Ref.get(configRef)
            yield* recorder.record({
              service: "ConfigFile",
              method: "read",
              result: config,
            })
            return config
          }),
        write: (data) =>
          Effect.gen(function* () {
            yield* Ref.set(configRef, data)
            yield* recorder.record({
              service: "ConfigFile",
              method: "write",
              args: data,
            })
          }),
      })
    })
  )

// ============================================================================
// Mock SentryConfig Layer (built from ConfigFile)
// ============================================================================

export const createMockSentryConfig = () =>
  Layer.effect(
    SentryConfig,
    Effect.gen(function* () {
      const configFile = yield* ConfigFile
      const config = yield* configFile.read()

      return SentryConfig.of({
        accessToken: config.accessToken
          ? Option.some(Redacted.make(config.accessToken))
          : Option.none(),
        host: config.host ?? "sentry.io",
        defaultOrg: config.defaultOrg
          ? Option.some(config.defaultOrg)
          : Option.none(),
        defaultProject: config.defaultProject
          ? Option.some(config.defaultProject)
          : Option.none(),
      })
    })
  )

// ============================================================================
// Mock SentryApi Service
// ============================================================================

export interface MockApiOptions {
  whoami?: { id: string; name: string; email: string }
  organizations?: Array<{ slug: string; name: string; links?: { organizationUrl?: string; regionUrl?: string } }>
  teams?: Array<{ id: string; slug: string; name: string }>
  projects?: Array<{ id: string; slug: string; name: string; platform?: string | null }>
  issues?: Array<{
    id: string
    shortId: string
    title: string
    status: string
    culprit?: string
    count?: string
    firstSeen?: string
    lastSeen?: string
    project?: { slug: string }
  }>
  failWhoami?: boolean
}

export const createMockSentryApi = (options: MockApiOptions = {}) =>
  Layer.effect(
    SentryApi,
    Effect.gen(function* () {
      const recorder = yield* CallRecorder

      const recordCall = <T>(
        method: string,
        args: unknown,
        result: T
      ): Effect.Effect<T> =>
        Effect.gen(function* () {
          yield* recorder.record({ service: "SentryApi", method, args, result })
          return result
        })

      // Build a mock API service that satisfies the SentryApiService interface
      const api: SentryApiService = {
        host: "sentry.io",

        getAuthenticatedUser: () => {
          if (options.failWhoami) {
            return Effect.fail(new ApiError({ message: "Unauthorized", status: 401 }))
          }
          return recordCall<User>("getAuthenticatedUser", undefined, options.whoami ?? {
            id: "1",
            name: "Test User",
            email: "test@example.com",
          })
        },

        listOrganizations: (params: { query?: string } = {}) =>
          recordCall("listOrganizations", params, (options.organizations ?? []).map(org => ({
            id: "1",
            ...org,
            links: org.links ? {
              organizationUrl: org.links.organizationUrl ?? "https://sentry.io",
              regionUrl: org.links.regionUrl,
            } : undefined,
          }))),

        getOrganization: (organizationSlug: string) => {
          const org = options.organizations?.[0]
          return recordCall("getOrganization", { organizationSlug }, {
            id: "1",
            slug: org?.slug ?? organizationSlug,
            name: org?.name ?? "Test Org",
            links: org?.links ? {
              organizationUrl: org.links.organizationUrl ?? "https://sentry.io",
              regionUrl: org.links.regionUrl,
            } : undefined,
          })
        },

        listTeams: (orgSlug: string, params: { query?: string } = {}) =>
          recordCall("listTeams", { orgSlug, ...params }, (options.teams ?? []).map(team => ({
            id: team.id ?? "1",
            slug: team.slug,
            name: team.name,
          }))),

        createTeam: (params: { organizationSlug: string; name: string }) =>
          recordCall("createTeam", params, {
            id: "new-team-id",
            slug: params.name.toLowerCase().replace(/\s+/g, "-"),
            name: params.name,
          }),

        listProjects: (orgSlug: string, params: { query?: string } = {}) =>
          recordCall("listProjects", { orgSlug, ...params }, (options.projects ?? []).map(proj => ({
            id: proj.id ?? "1",
            slug: proj.slug,
            name: proj.name,
            platform: proj.platform,
          }))),

        getProject: (params: { organizationSlug: string; projectSlugOrId: string }) => {
          const proj = options.projects?.[0]
          return recordCall("getProject", params, {
            id: proj?.id ?? "1",
            slug: proj?.slug ?? params.projectSlugOrId,
            name: proj?.name ?? "Test Project",
            platform: proj?.platform,
          })
        },

        createProject: (params: { organizationSlug: string; teamSlug: string; name: string; platform?: string | null }) =>
          recordCall("createProject", params, {
            id: "new-project-id",
            slug: params.name.toLowerCase().replace(/\s+/g, "-"),
            name: params.name,
            platform: params.platform,
          }),

        updateProject: (params: { organizationSlug: string; projectSlug: string; name?: string | null; slug?: string | null; platform?: string | null }) =>
          recordCall("updateProject", params, {
            id: "project-id",
            slug: params.slug ?? params.projectSlug,
            name: params.name ?? "Updated Project",
            platform: params.platform,
          }),

        listClientKeys: (params: { organizationSlug: string; projectSlug: string }) =>
          recordCall("listClientKeys", params, []),

        createClientKey: (params: { organizationSlug: string; projectSlug: string; name?: string }) =>
          recordCall("createClientKey", params, {
            id: "new-dsn-id",
            name: params.name ?? "Default",
            dsn: { public: "https://xxx@sentry.io/123" },
            isActive: true,
            dateCreated: new Date().toISOString(),
          }),

        listReleases: (params: { organizationSlug: string; projectSlug?: string; query?: string }) =>
          recordCall("listReleases", params, []),

        listIssues: (params: { organizationSlug: string; projectSlug?: string; query?: string | null; sortBy?: "user" | "freq" | "date" | "new"; limit?: number }) =>
          recordCall("listIssues", params, (options.issues ?? []).map(issue => ({
            id: issue.id,
            shortId: issue.shortId,
            title: issue.title,
            status: issue.status,
            firstSeen: issue.firstSeen ?? new Date().toISOString(),
            lastSeen: issue.lastSeen ?? new Date().toISOString(),
            count: issue.count ?? "1",
            userCount: "1",
            permalink: `https://sentry.io/issues/${issue.id}/`,
            project: issue.project ? { id: "1", slug: issue.project.slug, name: "Test Project" } : { id: "1", slug: "test-project", name: "Test Project" },
            culprit: issue.culprit ?? "unknown",
            type: "error",
          }))),

        getIssue: (params: { organizationSlug: string; issueId: string }) => {
          const issue = options.issues?.[0]
          return recordCall("getIssue", params, {
            id: issue?.id ?? params.issueId,
            shortId: issue?.shortId ?? "TEST-1",
            title: issue?.title ?? "Test Issue",
            status: issue?.status ?? "unresolved",
            firstSeen: issue?.firstSeen ?? new Date().toISOString(),
            lastSeen: issue?.lastSeen ?? new Date().toISOString(),
            count: issue?.count ?? "1",
            userCount: "1",
            permalink: `https://sentry.io/issues/${params.issueId}/`,
            project: issue?.project ? { id: "1", slug: issue.project.slug, name: "Test Project" } : { id: "1", slug: "test-project", name: "Test Project" },
            culprit: issue?.culprit ?? "unknown",
            type: "error",
          })
        },

        getLatestEventForIssue: (params: { organizationSlug: string; issueId: string }) =>
          recordCall("getLatestEventForIssue", params, {
            id: "event-1",
            title: "Test Event",
            message: "Test message",
            type: "error",
            culprit: "test.js",
            dateCreated: new Date().toISOString(),
            entries: [
              {
                type: "exception" as const,
                data: {
                  values: [
                    {
                      type: "Error",
                      value: "Test error message",
                      stacktrace: {
                        frames: [
                          { filename: "test.js", lineNo: 10, function: "testFunc" },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          }),

        listEventsForIssue: (params: { organizationSlug: string; issueId: string; query?: string; limit?: number; sort?: string; statsPeriod?: string }) =>
          recordCall("listEventsForIssue", params, []),

        listEventAttachments: (params: { organizationSlug: string; projectSlug: string; eventId: string }) =>
          recordCall("listEventAttachments", params, []),

        getEventAttachment: (params: { organizationSlug: string; projectSlug: string; eventId: string; attachmentId: string }) =>
          recordCall("getEventAttachment", params, {
            attachment: {
              id: params.attachmentId,
              name: "test.txt",
              type: "attachment",
              size: 4,
              mimetype: "text/plain",
              dateCreated: new Date().toISOString(),
              sha1: "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
            },
            downloadUrl: "https://example.com/download",
            filename: "test.txt",
            blob: new Blob(["test"]),
          }),

        updateIssue: (params: { organizationSlug: string; issueId: string; status?: string; assignedTo?: string }) =>
          recordCall("updateIssue", params, {
            id: params.issueId,
            shortId: "TEST-1",
            title: "Test Issue",
            status: params.status ?? "unresolved",
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            count: "1",
            userCount: "1",
            permalink: `https://sentry.io/issues/${params.issueId}/`,
            project: { id: "1", slug: "test-project", name: "Test Project" },
            culprit: "unknown",
            type: "error",
          }),

        startAutofix: (params: { organizationSlug: string; issueId: string; eventId?: string; instruction?: string }) =>
          recordCall("startAutofix", params, {
            run_id: 123,
          }),

        getAutofixState: (params: { organizationSlug: string; issueId: string }) =>
          recordCall("getAutofixState", params, {
            autofix: {
              run_id: 123,
              request: null,
              updated_at: new Date().toISOString(),
              status: "COMPLETED" as const,
              steps: [],
            },
          }),

        getIssueUrl: (orgSlug: string, issueId: string) =>
          `https://sentry.io/organizations/${orgSlug}/issues/${issueId}/`,

        getTraceMeta: (params: { organizationSlug: string; traceId: string; statsPeriod?: string }) =>
          recordCall("getTraceMeta", params, {
            span_count: 10,
            errors: 1,
            performance_issues: 0,
            logs: 5,
            transaction_child_count_map: [],
            span_count_map: { db: 3, http: 7 },
          }),

        getTrace: (params: { organizationSlug: string; traceId: string; limit?: number; project?: string; statsPeriod?: string }) =>
          recordCall("getTrace", params, []),

        getTraceUrl: (orgSlug: string, traceId: string) =>
          `https://sentry.io/organizations/${orgSlug}/performance/trace/${traceId}/`,

        searchEvents: (params: { organizationSlug: string; query: string; fields: string[]; limit?: number; projectId?: string; dataset?: "spans" | "errors" | "logs"; statsPeriod?: string; start?: string; end?: string; sort?: string }) =>
          recordCall<EventsResponse>("searchEvents", params, { data: [], meta: { fields: {} } }),
      }

      return api
    })
  )

// ============================================================================
// Test Layer Factory
// ============================================================================

export interface TestOptions {
  config?: MockConfigFileOptions
  api?: MockApiOptions
  /** Token to return when TokenProvider.promptForToken is called */
  promptedToken?: string
  /** Default org for test (for OrgService) */
  testOrg?: string
  /** Default project for test (for ProjectService) */
  testProject?: string
  /** Default team for test (for TeamService) */
  testTeam?: string
}

// ============================================================================
// Mock Browser Service
// ============================================================================

const createMockBrowser = () =>
  Layer.effect(
    Browser,
    Effect.gen(function* () {
      const recorder = yield* CallRecorder

      return Browser.of({
        open: (url) =>
          Effect.gen(function* () {
            yield* recorder.record({ service: "Browser", method: "open", args: { url } })
          }),
      })
    })
  )

// ============================================================================
// Mock TokenProvider Service
// ============================================================================

const createMockTokenProvider = (token?: string) =>
  Layer.effect(
    TokenProvider,
    Effect.gen(function* () {
      const recorder = yield* CallRecorder

      return TokenProvider.of({
        promptForToken: () =>
          Effect.gen(function* () {
            yield* recorder.record({ service: "TokenProvider", method: "promptForToken", args: {} })
            return token ?? ""
          }),
      })
    })
  )

/**
 * Create test layer with all mocks
 */
export const createTestLayer = (options: TestOptions = {}) => {
  const recorderLayer = CallRecorder.layer

  const configFileLayer = createMockConfigFile(options.config).pipe(
    Layer.provide(recorderLayer)
  )

  const sentryConfigLayer = createMockSentryConfig().pipe(
    Layer.provide(configFileLayer)
  )

  const apiLayer = createMockSentryApi(options.api).pipe(
    Layer.provide(recorderLayer)
  )

  const browserLayer = createMockBrowser().pipe(
    Layer.provide(recorderLayer)
  )

  const tokenProviderLayer = createMockTokenProvider(options.promptedToken).pipe(
    Layer.provide(recorderLayer)
  )

  // Test service implementations - return fixed values without prompting
  const orgServiceLayer = OrgService.test(options.testOrg ?? options.config?.initialConfig?.defaultOrg ?? "test-org")
  const projectServiceLayer = ProjectService.test(options.testProject ?? options.config?.initialConfig?.defaultProject ?? "test-project")
  const teamServiceLayer = TeamService.test(options.testTeam ?? "test-team")

  return Layer.mergeAll(
    recorderLayer,
    configFileLayer,
    sentryConfigLayer,
    apiLayer,
    browserLayer,
    tokenProviderLayer,
    orgServiceLayer,
    projectServiceLayer,
    teamServiceLayer
  )
}

// ============================================================================
// Test Runner
// ============================================================================

export interface TestResult {
  calls: ReadonlyArray<ServiceCall>
}

/**
 * Run a CLI command with mock services and return recorded calls.
 * Uses TestClock to make Effect.sleep calls instant.
 */
export const runCli = (args: string, options: TestOptions = {}) =>
  Effect.gen(function* () {
    const recorder = yield* CallRecorder

    // Parse args into array (simulating process.argv)
    const argv = ["node", "sentry", ...args.split(/\s+/).filter(Boolean)]

    // Run the CLI in a fiber so we can advance time
    const fiber = yield* cli(argv).pipe(
      Effect.catchAll(() => Effect.void),
      Effect.fork
    )

    // Advance time to make any Effect.sleep calls complete instantly
    // We do this in a loop to handle multiple sleeps (like polling)
    for (let i = 0; i < 10; i++) {
      yield* TestClock.adjust("10 seconds")
      // Small yield to let the fiber process
      yield* Effect.yieldNow()
    }

    // Wait for the CLI to complete
    yield* Fiber.join(fiber)

    // Get recorded calls
    const calls = yield* recorder.calls

    return { calls } as TestResult
  }).pipe(
    Effect.provide(
      Layer.mergeAll(
        createTestLayer(options),
        TestContext.TestContext,
        BunContext.layer
      )
    )
  )

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert a specific service method was called
 */
export const expectCall = (
  calls: ReadonlyArray<ServiceCall>,
  service: string,
  method: string,
  matchArgs?: Record<string, unknown>
): ServiceCall => {
  const found = calls.find((c) => {
    if (c.service !== service || c.method !== method) return false
    if (!matchArgs) return true

    const args = c.args as Record<string, unknown> | undefined
    if (!args) return false

    return Object.entries(matchArgs).every(([k, v]) => args[k] === v)
  })

  if (!found) {
    const argsStr = matchArgs ? ` with args matching ${JSON.stringify(matchArgs)}` : ""
    throw new Error(
      `Expected call to ${service}.${method}${argsStr} but not found.\nCalls: ${JSON.stringify(calls, null, 2)}`
    )
  }
  return found
}

/**
 * Assert no call was made to a service method
 */
export const expectNoCall = (
  calls: ReadonlyArray<ServiceCall>,
  service: string,
  method: string
): void => {
  const found = calls.find((c) => c.service === service && c.method === method)
  if (found) {
    throw new Error(
      `Expected no call to ${service}.${method} but found: ${JSON.stringify(found)}`
    )
  }
}

/**
 * Assert calls happened in a specific sequence
 */
export const expectSequence = (
  calls: ReadonlyArray<ServiceCall>,
  expected: Array<{ service: string; method: string; match?: Record<string, unknown> }>
): void => {
  let callIndex = 0

  for (const exp of expected) {
    let found = false

    while (callIndex < calls.length) {
      const call = calls[callIndex]
      callIndex++

      if (call.service !== exp.service || call.method !== exp.method) continue

      if (exp.match) {
        const args = call.args as Record<string, unknown> | undefined
        if (!args) continue
        if (!Object.entries(exp.match).every(([k, v]) => args[k] === v)) continue
      }

      found = true
      break
    }

    if (!found) {
      const matchStr = exp.match ? ` with ${JSON.stringify(exp.match)}` : ""
      throw new Error(
        `Expected call to ${exp.service}.${exp.method}${matchStr} not found in sequence.\n` +
        `Remaining calls: ${JSON.stringify(calls.slice(callIndex - 1), null, 2)}`
      )
    }
  }
}

/**
 * Get all calls to a specific service
 */
export const getServiceCalls = (
  calls: ReadonlyArray<ServiceCall>,
  service: string
): ReadonlyArray<ServiceCall> => calls.filter((c) => c.service === service)
