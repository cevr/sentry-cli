/**
 * Sentry API Client as an Effect service.
 * Adapted from sentry-mcp with Effect patterns.
 */
import { Context, Effect, Either, Layer, Option, Redacted, Schema } from "effect"
import {
  OrganizationListSchema,
  OrganizationSchema,
  TeamListSchema,
  TeamSchema,
  ProjectListSchema,
  ProjectSchema,
  ClientKeySchema,
  ClientKeyListSchema,
  ReleaseListSchema,
  IssueListSchema,
  IssueSchema,
  EventSchema,
  EventListSchema,
  EventAttachmentListSchema,
  EventsResponseSchema,
  TraceMetaSchema,
  TraceSchema,
  UserSchema,
  UserRegionsSchema,
  ApiErrorSchema,
  AutofixRunSchema,
  AutofixRunStateSchema,
} from "./schema.js"
import type {
  User,
  Organization,
  OrganizationList,
  Team,
  TeamList,
  Project,
  ProjectList,
  ClientKey,
  ClientKeyList,
  ReleaseList,
  Issue,
  IssueList,
  Event,
  EventList,
  EventAttachment,
  EventAttachmentList,
  EventsResponse,
  TraceMeta,
  Trace,
  AutofixRun,
  AutofixRunState,
} from "./schema.js"
import { ApiError, ApiValidationError } from "../errors/index.js"
import { SentryConfig } from "../config/index.js"

const USER_AGENT = "sentry-cli-effect/0.1.0"

/** Decode options that preserve extra fields (equivalent to Zod .passthrough()) */
const decodeOptions = { onExcessProperty: "preserve" } as const

/** Decode API response with Effect Schema, converting errors to ApiValidationError */
const decodeApi = <A, I>(schema: Schema.Schema<A, I>) => (input: unknown) =>
  Schema.decodeUnknown(schema)(input, decodeOptions).pipe(
    Effect.mapError(
      (e) =>
        new ApiValidationError({
          message: `Invalid API response`,
          details: e,
        })
    )
  )

/** Decode with Either for safeParse-like behavior */
const decodeEither = <A, I>(schema: Schema.Schema<A, I>) => (input: unknown) =>
  Schema.decodeUnknownEither(schema)(input, decodeOptions)

function isSentryHost(host: string): boolean {
  return (
    host === "sentry.io" ||
    host.endsWith(".sentry.io") ||
    host === "us.sentry.io" ||
    host === "eu.sentry.io" ||
    host === "de.sentry.io"
  )
}

function getIssueUrl(
  host: string,
  organizationSlug: string,
  issueId: string
): string {
  if (isSentryHost(host)) {
    return `https://${organizationSlug}.sentry.io/issues/${issueId}`
  }
  return `https://${host}/organizations/${organizationSlug}/issues/${issueId}`
}

function getTraceUrl(
  host: string,
  organizationSlug: string,
  traceId: string
): string {
  if (isSentryHost(host)) {
    return `https://${organizationSlug}.sentry.io/explore/traces/trace/${traceId}`
  }
  return `https://${host}/organizations/${organizationSlug}/explore/traces/trace/${traceId}`
}

export class SentryApi extends Context.Tag("@cvr/sentry/api/client/SentryApi")<
  SentryApi,
  {
    readonly host: string
    readonly getIssueUrl: (organizationSlug: string, issueId: string) => string
    readonly getTraceUrl: (organizationSlug: string, traceId: string) => string
    readonly getAuthenticatedUser: () => Effect.Effect<User, ApiError | ApiValidationError>
    readonly listOrganizations: (params?: {
      query?: string
    }) => Effect.Effect<OrganizationList, ApiError | ApiValidationError>
    readonly getOrganization: (
      organizationSlug: string
    ) => Effect.Effect<Organization, ApiError | ApiValidationError>
    readonly listTeams: (
      organizationSlug: string,
      params?: { query?: string }
    ) => Effect.Effect<TeamList, ApiError | ApiValidationError>
    readonly createTeam: (params: {
      organizationSlug: string
      name: string
    }) => Effect.Effect<Team, ApiError | ApiValidationError>
    readonly listProjects: (
      organizationSlug: string,
      params?: { query?: string }
    ) => Effect.Effect<ProjectList, ApiError | ApiValidationError>
    readonly getProject: (params: {
      organizationSlug: string
      projectSlugOrId: string
    }) => Effect.Effect<Project, ApiError | ApiValidationError>
    readonly createProject: (params: {
      organizationSlug: string
      teamSlug: string
      name: string
      platform?: string | null
    }) => Effect.Effect<Project, ApiError | ApiValidationError>
    readonly updateProject: (params: {
      organizationSlug: string
      projectSlug: string
      name?: string | null
      slug?: string | null
      platform?: string | null
    }) => Effect.Effect<Project, ApiError | ApiValidationError>
    readonly createClientKey: (params: {
      organizationSlug: string
      projectSlug: string
      name?: string
    }) => Effect.Effect<ClientKey, ApiError | ApiValidationError>
    readonly listClientKeys: (params: {
      organizationSlug: string
      projectSlug: string
    }) => Effect.Effect<ClientKeyList, ApiError | ApiValidationError>
    readonly listReleases: (params: {
      organizationSlug: string
      projectSlug?: string
      query?: string
    }) => Effect.Effect<ReleaseList, ApiError | ApiValidationError>
    readonly listIssues: (params: {
      organizationSlug: string
      projectSlug?: string
      query?: string | null
      sortBy?: "user" | "freq" | "date" | "new"
      limit?: number
    }) => Effect.Effect<IssueList, ApiError | ApiValidationError>
    readonly getIssue: (params: {
      organizationSlug: string
      issueId: string
    }) => Effect.Effect<Issue, ApiError | ApiValidationError>
    readonly getLatestEventForIssue: (params: {
      organizationSlug: string
      issueId: string
    }) => Effect.Effect<Event, ApiError | ApiValidationError>
    readonly listEventsForIssue: (params: {
      organizationSlug: string
      issueId: string
      query?: string
      limit?: number
      sort?: string
      statsPeriod?: string
    }) => Effect.Effect<EventList, ApiError | ApiValidationError>
    readonly listEventAttachments: (params: {
      organizationSlug: string
      projectSlug: string
      eventId: string
    }) => Effect.Effect<EventAttachmentList, ApiError | ApiValidationError>
    readonly getEventAttachment: (params: {
      organizationSlug: string
      projectSlug: string
      eventId: string
      attachmentId: string
    }) => Effect.Effect<
      {
        attachment: EventAttachment
        downloadUrl: string
        filename: string
        blob: Blob
      },
      ApiError | ApiValidationError
    >
    readonly updateIssue: (params: {
      organizationSlug: string
      issueId: string
      status?: string
      assignedTo?: string
    }) => Effect.Effect<Issue, ApiError | ApiValidationError>
    readonly getTraceMeta: (params: {
      organizationSlug: string
      traceId: string
      statsPeriod?: string
    }) => Effect.Effect<TraceMeta, ApiError | ApiValidationError>
    readonly getTrace: (params: {
      organizationSlug: string
      traceId: string
      limit?: number
      project?: string
      statsPeriod?: string
    }) => Effect.Effect<Trace, ApiError | ApiValidationError>
    readonly searchEvents: (params: {
      organizationSlug: string
      query: string
      fields: string[]
      limit?: number
      projectId?: string
      dataset?: "spans" | "errors" | "logs"
      statsPeriod?: string
      start?: string
      end?: string
      sort?: string
    }) => Effect.Effect<EventsResponse, ApiError | ApiValidationError>
    readonly startAutofix: (params: {
      organizationSlug: string
      issueId: string
      eventId?: string
      instruction?: string
    }) => Effect.Effect<AutofixRun, ApiError | ApiValidationError>
    readonly getAutofixState: (params: {
      organizationSlug: string
      issueId: string
    }) => Effect.Effect<AutofixRunState, ApiError | ApiValidationError>
  }
>() {
  static readonly layer = Layer.effect(
    SentryApi,
    Effect.gen(function* () {
      const config = yield* SentryConfig
      const host = config.host
      const apiPrefix = `https://${host}/api/0`

      const accessToken = Option.getOrElse(config.accessToken, () =>
        Redacted.make("")
      )

      const request = Effect.fn("SentryApi.request")(function* (
        path: string,
        options: RequestInit = {},
        requestHost?: string
      ) {
        const url = requestHost !== undefined
          ? `https://${requestHost}/api/0${path}`
          : `${apiPrefix}${path}`

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
        }

        const token = Redacted.value(accessToken)
        if (token !== "") {
          headers.Authorization = `Bearer ${token}`
        }

        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(url, {
              ...options,
              headers,
            }),
          catch: (error) =>
            new ApiError({
              message: `Failed to connect to ${url}: ${error instanceof Error ? error.message : String(error)}`,
              cause: error,
            }),
        })

        if (!response.ok) {
          const errorText = yield* Effect.tryPromise({
            try: () => response.text(),
            catch: () => new ApiError({ message: "Failed to read error response" }),
          })

          const parsed = Option.fromNullable(
            (() => {
              try {
                return JSON.parse(errorText) as unknown
              } catch {
                return null
              }
            })()
          )

          if (Option.isSome(parsed)) {
            const result = decodeEither(ApiErrorSchema)(parsed.value)
            if (Either.isRight(result)) {
              if (response.status === 404) {
                return yield* new ApiError({
                  message: result.right.detail,
                  status: 404,
                })
              }
              return yield* new ApiError({
                message: result.right.detail,
                status: response.status,
              })
            }
          }

          if (response.status === 404) {
            return yield* new ApiError({
              message: `Not found: ${path}`,
              status: 404,
            })
          }

          return yield* new ApiError({
            message: `API request failed: ${response.statusText}\n${errorText}`,
            status: response.status,
          })
        }

        return response
      })

      const requestJSON = Effect.fn("SentryApi.requestJSON")(function* (
        path: string,
        options: RequestInit = {},
        requestHost?: string
      ) {
        const response = yield* request(path, options, requestHost)
        return yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) =>
            new ApiError({
              message: `Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`,
              cause: error,
            }),
        })
      })

      const isSaas = () => isSentryHost(host)

      const getAuthenticatedUser = Effect.fn("SentryApi.getAuthenticatedUser")(
        function* () {
          const authHost = isSaas() ? "sentry.io" : undefined
          const body = yield* requestJSON("/auth/", undefined, authHost)
          return yield* decodeApi(UserSchema)(body)
        }
      )

      const listOrganizations = Effect.fn("SentryApi.listOrganizations")(
        function* (params?: { query?: string }) {
          const queryParams = new URLSearchParams()
          queryParams.set("per_page", "25")
          if (params?.query !== undefined && params.query !== "") {
            queryParams.set("query", params.query)
          }
          const path = `/organizations/?${queryParams.toString()}`

          if (!isSaas()) {
            const body = yield* requestJSON(path)
            return yield* decodeApi(OrganizationListSchema)(body)
          }

          // For SaaS, try regions endpoint
          const regionsResult = yield* Effect.tryPromise({
            try: async () => {
              const resp = await fetch(`https://sentry.io/api/0/users/me/regions/`, {
                headers: {
                  Authorization: `Bearer ${Redacted.value(accessToken)}`,
                  "User-Agent": USER_AGENT,
                },
              })
              if (!resp.ok) throw new Error("Regions not available")
              return resp.json()
            },
            catch: () =>
              new ApiError({
                message: "Regions endpoint not available",
              }),
          }).pipe(Effect.catchAll(() => Effect.succeed(null)))

          if (regionsResult !== null) {
            const regionData = decodeEither(UserRegionsSchema)(regionsResult)
            if (Either.isRight(regionData)) {
              const allOrgs = yield* Effect.all(
                regionData.right.regions.map((region) =>
                  requestJSON(path, undefined, new URL(region.url).host).pipe(
                    Effect.flatMap(decodeApi(OrganizationListSchema)),
                    Effect.catchAll(() => Effect.succeed([] as OrganizationList))
                  )
                ),
                { concurrency: "unbounded" }
              )
              return allOrgs.flat().slice(0, 25)
            }
          }

          const body = yield* requestJSON(path)
          return yield* decodeApi(OrganizationListSchema)(body)
        }
      )

      const getOrganization = Effect.fn("SentryApi.getOrganization")(
        function* (organizationSlug: string) {
          const body = yield* requestJSON(`/organizations/${organizationSlug}/`)
          return yield* decodeApi(OrganizationSchema)(body)
        }
      )

      const listTeams = Effect.fn("SentryApi.listTeams")(function* (
        organizationSlug: string,
        params?: { query?: string }
      ) {
        const queryParams = new URLSearchParams()
        queryParams.set("per_page", "25")
        if (params?.query !== undefined && params.query !== "") {
          queryParams.set("query", params.query)
        }
        const body = yield* requestJSON(
          `/organizations/${organizationSlug}/teams/?${queryParams.toString()}`
        )
        return yield* decodeApi(TeamListSchema)(body)
      })

      const createTeam = Effect.fn("SentryApi.createTeam")(function* (params: {
        organizationSlug: string
        name: string
      }) {
        const body = yield* requestJSON(
          `/organizations/${params.organizationSlug}/teams/`,
          {
            method: "POST",
            body: JSON.stringify({ name: params.name }),
          }
        )
        return yield* decodeApi(TeamSchema)(body)
      })

      const listProjects = Effect.fn("SentryApi.listProjects")(function* (
        organizationSlug: string,
        params?: { query?: string }
      ) {
        const queryParams = new URLSearchParams()
        queryParams.set("per_page", "25")
        if (params?.query !== undefined && params.query !== "") {
          queryParams.set("query", params.query)
        }
        const body = yield* requestJSON(
          `/organizations/${organizationSlug}/projects/?${queryParams.toString()}`
        )
        return yield* decodeApi(ProjectListSchema)(body)
      })

      const getProject = Effect.fn("SentryApi.getProject")(function* (params: {
        organizationSlug: string
        projectSlugOrId: string
      }) {
        const body = yield* requestJSON(
          `/projects/${params.organizationSlug}/${params.projectSlugOrId}/`
        )
        return yield* decodeApi(ProjectSchema)(body)
      })

      const createProject = Effect.fn("SentryApi.createProject")(
        function* (params: {
          organizationSlug: string
          teamSlug: string
          name: string
          platform?: string | null
        }) {
          const createData: Record<string, any> = { name: params.name }
          if (params.platform !== undefined && params.platform !== null) {
            createData.platform = params.platform
          }
          const body = yield* requestJSON(
            `/teams/${params.organizationSlug}/${params.teamSlug}/projects/`,
            {
              method: "POST",
              body: JSON.stringify(createData),
            }
          )
          return yield* decodeApi(ProjectSchema)(body)
        }
      )

      const updateProject = Effect.fn("SentryApi.updateProject")(
        function* (params: {
          organizationSlug: string
          projectSlug: string
          name?: string | null
          slug?: string | null
          platform?: string | null
        }) {
          const updateData: Record<string, any> = {}
          if (params.name !== undefined && params.name !== null) updateData.name = params.name
          if (params.slug !== undefined && params.slug !== null) updateData.slug = params.slug
          if (params.platform !== undefined && params.platform !== null) updateData.platform = params.platform

          const body = yield* requestJSON(
            `/projects/${params.organizationSlug}/${params.projectSlug}/`,
            {
              method: "PUT",
              body: JSON.stringify(updateData),
            }
          )
          return yield* decodeApi(ProjectSchema)(body)
        }
      )

      const createClientKey = Effect.fn("SentryApi.createClientKey")(
        function* (params: {
          organizationSlug: string
          projectSlug: string
          name?: string
        }) {
          const body = yield* requestJSON(
            `/projects/${params.organizationSlug}/${params.projectSlug}/keys/`,
            {
              method: "POST",
              body: JSON.stringify({ name: params.name }),
            }
          )
          return yield* decodeApi(ClientKeySchema)(body)
        }
      )

      const listClientKeys = Effect.fn("SentryApi.listClientKeys")(
        function* (params: { organizationSlug: string; projectSlug: string }) {
          const body = yield* requestJSON(
            `/projects/${params.organizationSlug}/${params.projectSlug}/keys/`
          )
          return yield* decodeApi(ClientKeyListSchema)(body)
        }
      )

      const listReleases = Effect.fn("SentryApi.listReleases")(
        function* (params: {
          organizationSlug: string
          projectSlug?: string
          query?: string
        }) {
          const searchQuery = new URLSearchParams()
          if (params.query !== undefined && params.query !== "") {
            searchQuery.set("query", params.query)
          }

          const path = params.projectSlug !== undefined && params.projectSlug !== ""
            ? `/projects/${params.organizationSlug}/${params.projectSlug}/releases/`
            : `/organizations/${params.organizationSlug}/releases/`

          const body = yield* requestJSON(
            searchQuery.toString() !== "" ? `${path}?${searchQuery.toString()}` : path
          )
          return yield* decodeApi(ReleaseListSchema)(body)
        }
      )

      const listIssues = Effect.fn("SentryApi.listIssues")(function* (params: {
        organizationSlug: string
        projectSlug?: string
        query?: string | null
        sortBy?: "user" | "freq" | "date" | "new"
        limit?: number
      }) {
        const sentryQuery: string[] = []
        if (params.query !== undefined && params.query !== null && params.query !== "") {
          sentryQuery.push(params.query)
        }

        const queryParams = new URLSearchParams()
        queryParams.set("per_page", String(params.limit ?? 10))
        if (params.sortBy !== undefined) queryParams.set("sort", params.sortBy)
        queryParams.set("statsPeriod", "24h")
        queryParams.set("query", sentryQuery.join(" "))
        queryParams.append("collapse", "unhandled")

        const apiUrl = params.projectSlug !== undefined && params.projectSlug !== ""
          ? `/projects/${params.organizationSlug}/${params.projectSlug}/issues/?${queryParams.toString()}`
          : `/organizations/${params.organizationSlug}/issues/?${queryParams.toString()}`

        const body = yield* requestJSON(apiUrl)
        return yield* decodeApi(IssueListSchema)(body)
      })

      const getIssue = Effect.fn("SentryApi.getIssue")(function* (params: {
        organizationSlug: string
        issueId: string
      }) {
        const body = yield* requestJSON(
          `/organizations/${params.organizationSlug}/issues/${params.issueId}/`
        )
        return yield* decodeApi(IssueSchema)(body)
      })

      const getLatestEventForIssue = Effect.fn(
        "SentryApi.getLatestEventForIssue"
      )(function* (params: { organizationSlug: string; issueId: string }) {
        const body = yield* requestJSON(
          `/organizations/${params.organizationSlug}/issues/${params.issueId}/events/latest/`
        )
        return yield* decodeApi(EventSchema)(body)
      })

      const listEventsForIssue = Effect.fn("SentryApi.listEventsForIssue")(
        function* (params: {
          organizationSlug: string
          issueId: string
          query?: string
          limit?: number
          sort?: string
          statsPeriod?: string
        }) {
          const queryParams = new URLSearchParams()
          if (params.query !== undefined && params.query !== "") queryParams.append("query", params.query)
          if (params.limit !== undefined) queryParams.append("per_page", String(params.limit))
          if (params.sort !== undefined && params.sort !== "") queryParams.append("sort", params.sort)
          if (params.statsPeriod !== undefined && params.statsPeriod !== "") queryParams.append("statsPeriod", params.statsPeriod)

          const query = queryParams.toString()
          const url = `/organizations/${params.organizationSlug}/issues/${params.issueId}/events/${query !== "" ? `?${query}` : ""}`

          const body = yield* requestJSON(url)
          return yield* decodeApi(EventListSchema)(body)
        }
      )

      const listEventAttachments = Effect.fn("SentryApi.listEventAttachments")(
        function* (params: {
          organizationSlug: string
          projectSlug: string
          eventId: string
        }) {
          const body = yield* requestJSON(
            `/projects/${params.organizationSlug}/${params.projectSlug}/events/${params.eventId}/attachments/`
          )
          return yield* decodeApi(EventAttachmentListSchema)(body)
        }
      )

      const getEventAttachment = Effect.fn("SentryApi.getEventAttachment")(
        function* (params: {
          organizationSlug: string
          projectSlug: string
          eventId: string
          attachmentId: string
        }) {
          const attachmentsData = yield* requestJSON(
            `/projects/${params.organizationSlug}/${params.projectSlug}/events/${params.eventId}/attachments/`
          )

          const attachments = yield* decodeApi(EventAttachmentListSchema)(attachmentsData)
          const attachment = attachments.find(
            (att) => att.id === params.attachmentId
          )

          if (attachment === undefined) {
            return yield* new ApiError({
              message: `Attachment with ID ${params.attachmentId} not found for event ${params.eventId}`,
              status: 404,
            })
          }

          const downloadUrl = `/projects/${params.organizationSlug}/${params.projectSlug}/events/${params.eventId}/attachments/${params.attachmentId}/?download=1`
          const downloadResponse = yield* request(downloadUrl, {
            method: "GET",
            headers: {
              Accept: "application/octet-stream",
            },
          })

          const blob = yield* Effect.tryPromise({
            try: () => downloadResponse.blob(),
            catch: (error) =>
              new ApiError({
                message: `Failed to download attachment: ${error instanceof Error ? error.message : String(error)}`,
                cause: error,
              }),
          })

          return {
            attachment,
            downloadUrl: downloadResponse.url,
            filename: attachment.name,
            blob,
          }
        }
      )

      const updateIssue = Effect.fn("SentryApi.updateIssue")(function* (params: {
        organizationSlug: string
        issueId: string
        status?: string
        assignedTo?: string
      }) {
        const updateData: Record<string, any> = {}
        if (params.status !== undefined) updateData.status = params.status
        if (params.assignedTo !== undefined)
          updateData.assignedTo = params.assignedTo

        const body = yield* requestJSON(
          `/organizations/${params.organizationSlug}/issues/${params.issueId}/`,
          {
            method: "PUT",
            body: JSON.stringify(updateData),
          }
        )
        return yield* decodeApi(IssueSchema)(body)
      })

      const getTraceMeta = Effect.fn("SentryApi.getTraceMeta")(
        function* (params: {
          organizationSlug: string
          traceId: string
          statsPeriod?: string
        }) {
          const queryParams = new URLSearchParams()
          queryParams.set("statsPeriod", params.statsPeriod ?? "14d")

          const body = yield* requestJSON(
            `/organizations/${params.organizationSlug}/trace-meta/${params.traceId}/?${queryParams.toString()}`
          )
          return yield* decodeApi(TraceMetaSchema)(body)
        }
      )

      const getTrace = Effect.fn("SentryApi.getTrace")(function* (params: {
        organizationSlug: string
        traceId: string
        limit?: number
        project?: string
        statsPeriod?: string
      }) {
        const queryParams = new URLSearchParams()
        queryParams.set("limit", String(params.limit ?? 1000))
        queryParams.set("project", params.project ?? "-1")
        queryParams.set("statsPeriod", params.statsPeriod ?? "14d")

        const body = yield* requestJSON(
          `/organizations/${params.organizationSlug}/trace/${params.traceId}/?${queryParams.toString()}`
        )
        return yield* decodeApi(TraceSchema)(body)
      })

      const searchEvents = Effect.fn("SentryApi.searchEvents")(
        function* (params: {
          organizationSlug: string
          query: string
          fields: string[]
          limit?: number
          projectId?: string
          dataset?: "spans" | "errors" | "logs"
          statsPeriod?: string
          start?: string
          end?: string
          sort?: string
        }) {
          const queryParams = new URLSearchParams()
          queryParams.set("per_page", String(params.limit ?? 10))
          queryParams.set("query", params.query)
          queryParams.set("dataset", params.dataset ?? "spans")

          if (params.statsPeriod !== undefined && params.statsPeriod !== "") {
            queryParams.set("statsPeriod", params.statsPeriod)
          } else if (params.start !== undefined && params.start !== "" && params.end !== undefined && params.end !== "") {
            queryParams.set("start", params.start)
            queryParams.set("end", params.end)
          }

          if (params.projectId !== undefined && params.projectId !== "") {
            queryParams.set("project", params.projectId)
          }

          if (params.sort !== undefined && params.sort !== "") {
            queryParams.set("sort", params.sort)
          }

          for (const field of params.fields) {
            queryParams.append("field", field)
          }

          const body = yield* requestJSON(
            `/organizations/${params.organizationSlug}/events/?${queryParams.toString()}`
          )
          return yield* decodeApi(EventsResponseSchema)(body)
        }
      )

      const startAutofix = Effect.fn("SentryApi.startAutofix")(
        function* (params: {
          organizationSlug: string
          issueId: string
          eventId?: string
          instruction?: string
        }) {
          const body = yield* requestJSON(
            `/organizations/${params.organizationSlug}/issues/${params.issueId}/autofix/`,
            {
              method: "POST",
              body: JSON.stringify({
                event_id: params.eventId,
                instruction: params.instruction ?? "",
              }),
            }
          )
          return yield* decodeApi(AutofixRunSchema)(body)
        }
      )

      const getAutofixState = Effect.fn("SentryApi.getAutofixState")(
        function* (params: { organizationSlug: string; issueId: string }) {
          const body = yield* requestJSON(
            `/organizations/${params.organizationSlug}/issues/${params.issueId}/autofix/`
          )
          return yield* decodeApi(AutofixRunStateSchema)(body)
        }
      )

      return SentryApi.of({
        host,
        getIssueUrl: (orgSlug, issueId) => getIssueUrl(host, orgSlug, issueId),
        getTraceUrl: (orgSlug, traceId) => getTraceUrl(host, orgSlug, traceId),
        getAuthenticatedUser,
        listOrganizations,
        getOrganization,
        listTeams,
        createTeam,
        listProjects,
        getProject,
        createProject,
        updateProject,
        createClientKey,
        listClientKeys,
        listReleases,
        listIssues,
        getIssue,
        getLatestEventForIssue,
        listEventsForIssue,
        listEventAttachments,
        getEventAttachment,
        updateIssue,
        getTraceMeta,
        getTrace,
        searchEvents,
        startAutofix,
        getAutofixState,
      })
    })
  )

  static readonly Live = Layer.provide(this.layer, SentryConfig.Live)
}
