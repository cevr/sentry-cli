/**
 * Effect Schema definitions for Sentry API response validation.
 * Migrated from Zod.
 */
import { Schema } from "effect"

// ============================================================================
// Helpers
// ============================================================================

/** String or number ID (common in Sentry API) */
const StringOrNumber = Schema.Union(Schema.String, Schema.Number)

// ============================================================================
// Base Schemas
// ============================================================================

export const ApiErrorSchema = Schema.Struct({
  detail: Schema.String,
})

export const UserSchema = Schema.Struct({
  id: StringOrNumber,
  name: Schema.NullOr(Schema.String),
  email: Schema.String,
})

export type User = typeof UserSchema.Type

export const UserRegionsSchema = Schema.Struct({
  regions: Schema.Array(
    Schema.Struct({
      name: Schema.String,
      url: Schema.String,
    })
  ),
})

export type UserRegions = typeof UserRegionsSchema.Type

export const OrganizationSchema = Schema.Struct({
  id: StringOrNumber,
  slug: Schema.String,
  name: Schema.String,
  links: Schema.optional(
    Schema.Struct({
      regionUrl: Schema.optional(Schema.String),
      organizationUrl: Schema.String,
    })
  ),
})

export type Organization = typeof OrganizationSchema.Type

export const OrganizationListSchema = Schema.Array(OrganizationSchema)

export type OrganizationList = typeof OrganizationListSchema.Type

export const TeamSchema = Schema.Struct({
  id: StringOrNumber,
  slug: Schema.String,
  name: Schema.String,
})

export type Team = typeof TeamSchema.Type

export const TeamListSchema = Schema.Array(TeamSchema)

export type TeamList = typeof TeamListSchema.Type

export const ProjectSchema = Schema.Struct({
  id: StringOrNumber,
  slug: Schema.String,
  name: Schema.String,
  platform: Schema.optional(Schema.NullOr(Schema.String)),
})

export type Project = typeof ProjectSchema.Type

export const ProjectListSchema = Schema.Array(ProjectSchema)

export type ProjectList = typeof ProjectListSchema.Type

export const ClientKeySchema = Schema.Struct({
  id: StringOrNumber,
  name: Schema.String,
  dsn: Schema.Struct({
    public: Schema.String,
  }),
  isActive: Schema.Boolean,
  dateCreated: Schema.String,
})

export type ClientKey = typeof ClientKeySchema.Type

export const ClientKeyListSchema = Schema.Array(ClientKeySchema)

export type ClientKeyList = typeof ClientKeyListSchema.Type

export const ReleaseSchema = Schema.Struct({
  id: StringOrNumber,
  version: Schema.String,
  shortVersion: Schema.String,
  dateCreated: Schema.String,
  dateReleased: Schema.NullOr(Schema.String),
  firstEvent: Schema.NullOr(Schema.String),
  lastEvent: Schema.NullOr(Schema.String),
  newGroups: Schema.Number,
  lastCommit: Schema.NullOr(
    Schema.Struct({
      id: StringOrNumber,
      message: Schema.String,
      dateCreated: Schema.String,
      author: Schema.Struct({
        name: Schema.String,
        email: Schema.String,
      }),
    })
  ),
  lastDeploy: Schema.NullOr(
    Schema.Struct({
      id: StringOrNumber,
      environment: Schema.String,
      dateStarted: Schema.NullOr(Schema.String),
      dateFinished: Schema.NullOr(Schema.String),
    })
  ),
  projects: Schema.Array(ProjectSchema),
})

export type Release = typeof ReleaseSchema.Type

export const ReleaseListSchema = Schema.Array(ReleaseSchema)

export type ReleaseList = typeof ReleaseListSchema.Type

export const TagSchema = Schema.Struct({
  key: Schema.String,
  name: Schema.String,
  totalValues: Schema.Number,
})

export type Tag = typeof TagSchema.Type

export const TagListSchema = Schema.Array(TagSchema)

export type TagList = typeof TagListSchema.Type

const AssignedToObjectSchema = Schema.Struct({
  type: Schema.Literal("user", "team"),
  id: StringOrNumber,
  name: Schema.String,
  email: Schema.optional(Schema.String),
})

export const AssignedToSchema = Schema.Union(
  Schema.Null,
  Schema.String,
  AssignedToObjectSchema
)

export type AssignedTo = typeof AssignedToSchema.Type

const IssueMetadataSchema = Schema.Struct({
  title: Schema.optional(Schema.NullOr(Schema.String)),
  location: Schema.optional(Schema.NullOr(Schema.String)),
  value: Schema.optional(Schema.NullOr(Schema.String)),
})

export const IssueSchema = Schema.Struct({
  id: StringOrNumber,
  shortId: Schema.String,
  title: Schema.String,
  firstSeen: Schema.String,
  lastSeen: Schema.String,
  count: StringOrNumber,
  userCount: StringOrNumber,
  permalink: Schema.String,
  project: ProjectSchema,
  platform: Schema.optional(Schema.NullOr(Schema.String)),
  status: Schema.String,
  substatus: Schema.optional(Schema.NullOr(Schema.String)),
  culprit: Schema.String,
  type: Schema.Union(
    Schema.Literal("error"),
    Schema.Literal("transaction"),
    Schema.Literal("generic"),
    Schema.Unknown
  ),
  assignedTo: Schema.optional(AssignedToSchema),
  issueType: Schema.optional(Schema.String),
  issueCategory: Schema.optional(Schema.String),
  metadata: Schema.optional(IssueMetadataSchema),
})

export type Issue = typeof IssueSchema.Type

export const IssueListSchema = Schema.Array(IssueSchema)

export type IssueList = typeof IssueListSchema.Type

// ============================================================================
// Event Schemas
// ============================================================================

export const FrameInterface = Schema.partial(
  Schema.Struct({
    filename: Schema.NullOr(Schema.String),
    function: Schema.NullOr(Schema.String),
    lineNo: Schema.NullOr(Schema.Number),
    colNo: Schema.NullOr(Schema.Number),
    absPath: Schema.NullOr(Schema.String),
    module: Schema.NullOr(Schema.String),
    context: Schema.Array(Schema.Tuple(Schema.Number, Schema.String)),
    inApp: Schema.optional(Schema.Boolean),
    vars: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  })
)

export const ExceptionInterface = Schema.partial(
  Schema.Struct({
    mechanism: Schema.partial(
      Schema.Struct({
        type: Schema.NullOr(Schema.String),
        handled: Schema.NullOr(Schema.Boolean),
      })
    ),
    type: Schema.NullOr(Schema.String),
    value: Schema.NullOr(Schema.String),
    stacktrace: Schema.Struct({
      frames: Schema.Array(FrameInterface),
    }),
  })
)

export const ErrorEntrySchema = Schema.partial(
  Schema.Struct({
    values: Schema.Array(Schema.UndefinedOr(ExceptionInterface)),
    value: Schema.optional(Schema.NullOr(ExceptionInterface)),
  })
)

export const RequestEntrySchema = Schema.partial(
  Schema.Struct({
    method: Schema.NullOr(Schema.String),
    url: Schema.NullOr(Schema.String),
  })
)

export const MessageEntrySchema = Schema.partial(
  Schema.Struct({
    formatted: Schema.NullOr(Schema.String),
    message: Schema.NullOr(Schema.String),
    params: Schema.optional(Schema.Array(Schema.Unknown)),
  })
)

export const ThreadEntrySchema = Schema.partial(
  Schema.Struct({
    id: Schema.NullOr(Schema.Number),
    name: Schema.NullOr(Schema.String),
    current: Schema.NullOr(Schema.Boolean),
    crashed: Schema.NullOr(Schema.Boolean),
    state: Schema.NullOr(Schema.String),
    stacktrace: Schema.NullOr(
      Schema.Struct({
        frames: Schema.Array(FrameInterface),
      })
    ),
  })
)

export const ThreadsEntrySchema = Schema.partial(
  Schema.Struct({
    values: Schema.Array(ThreadEntrySchema),
  })
)

export const BreadcrumbSchema = Schema.partial(
  Schema.Struct({
    timestamp: Schema.NullOr(Schema.String),
    type: Schema.NullOr(Schema.String),
    category: Schema.NullOr(Schema.String),
    level: Schema.NullOr(Schema.String),
    message: Schema.NullOr(Schema.String),
    data: Schema.NullOr(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  })
)

export const BreadcrumbsEntrySchema = Schema.partial(
  Schema.Struct({
    values: Schema.Array(BreadcrumbSchema),
  })
)

const EventEntrySchema = Schema.Union(
  Schema.Struct({
    type: Schema.Literal("exception"),
    data: ErrorEntrySchema,
  }),
  Schema.Struct({
    type: Schema.Literal("message"),
    data: MessageEntrySchema,
  }),
  Schema.Struct({
    type: Schema.Literal("threads"),
    data: ThreadsEntrySchema,
  }),
  Schema.Struct({
    type: Schema.Literal("request"),
    data: RequestEntrySchema,
  }),
  Schema.Struct({
    type: Schema.Literal("breadcrumbs"),
    data: BreadcrumbsEntrySchema,
  }),
  Schema.Struct({
    type: Schema.Literal("spans"),
    data: Schema.Unknown,
  }),
  Schema.Struct({
    type: Schema.String,
    data: Schema.Unknown,
  })
)

const ContextSchema = Schema.Struct({
  type: Schema.Union(
    Schema.Literal("default"),
    Schema.Literal("runtime"),
    Schema.Literal("os"),
    Schema.Literal("trace"),
    Schema.Unknown
  ),
})

const EventTagSchema = Schema.Struct({
  key: Schema.String,
  value: Schema.NullOr(Schema.String),
})

const BaseEventFields = {
  id: Schema.String,
  title: Schema.String,
  message: Schema.NullOr(Schema.String),
  platform: Schema.optional(Schema.NullOr(Schema.String)),
  entries: Schema.Array(EventEntrySchema),
  contexts: Schema.optional(Schema.Record({ key: Schema.String, value: ContextSchema })),
  context: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  tags: Schema.optional(Schema.Array(EventTagSchema)),
  _meta: Schema.optional(Schema.Unknown),
  dateReceived: Schema.optional(Schema.String),
}

export const ErrorEventSchema = Schema.Struct({
  ...BaseEventFields,
  type: Schema.Literal("error"),
  culprit: Schema.NullOr(Schema.String),
  dateCreated: Schema.String,
})

export type ErrorEvent = typeof ErrorEventSchema.Type

export const DefaultEventSchema = Schema.Struct({
  ...BaseEventFields,
  type: Schema.Literal("default"),
  culprit: Schema.optional(Schema.NullOr(Schema.String)),
  dateCreated: Schema.String,
})

export type DefaultEvent = typeof DefaultEventSchema.Type

export const EvidenceDisplaySchema = Schema.Struct({
  name: Schema.String,
  value: Schema.String,
  important: Schema.optional(Schema.Boolean),
})

const TransactionOccurrenceSchema = Schema.Struct({
  id: Schema.optional(Schema.String),
  projectId: Schema.optional(Schema.Number),
  eventId: Schema.optional(Schema.String),
  fingerprint: Schema.optional(Schema.Array(Schema.String)),
  issueTitle: Schema.String,
  subtitle: Schema.optional(Schema.String),
  resourceId: Schema.optional(Schema.NullOr(Schema.String)),
  evidenceData: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  evidenceDisplay: Schema.optional(Schema.Array(EvidenceDisplaySchema)),
  type: Schema.optional(Schema.Number),
  detectionTime: Schema.optional(Schema.Number),
  level: Schema.optional(Schema.String),
  culprit: Schema.NullOr(Schema.String),
  priority: Schema.optional(Schema.Number),
  assignee: Schema.optional(Schema.NullOr(Schema.String)),
})

export const TransactionEventSchema = Schema.Struct({
  ...BaseEventFields,
  type: Schema.Literal("transaction"),
  occurrence: Schema.optional(Schema.NullOr(TransactionOccurrenceSchema)),
})

export type TransactionEvent = typeof TransactionEventSchema.Type

export const OccurrenceSchema = Schema.Struct({
  id: Schema.String,
  projectId: Schema.Number,
  eventId: Schema.String,
  fingerprint: Schema.Array(Schema.String),
  issueTitle: Schema.String,
  subtitle: Schema.optional(Schema.String),
  resourceId: Schema.optional(Schema.NullOr(Schema.String)),
  evidenceData: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
  evidenceDisplay: Schema.optional(
    Schema.Array(
      Schema.Struct({
        name: Schema.String,
        value: Schema.String,
        important: Schema.Boolean,
      })
    )
  ),
  type: Schema.Number,
  detectionTime: Schema.optional(Schema.Number),
  level: Schema.optional(Schema.String),
  culprit: Schema.optional(Schema.String),
  priority: Schema.optional(Schema.Number),
  assignee: Schema.optional(Schema.NullOr(Schema.String)),
})

export type Occurrence = typeof OccurrenceSchema.Type

export const GenericEventSchema = Schema.Struct({
  ...BaseEventFields,
  type: Schema.Literal("generic"),
  culprit: Schema.optional(Schema.NullOr(Schema.String)),
  dateCreated: Schema.String,
  occurrence: Schema.optional(OccurrenceSchema),
})

export type GenericEvent = typeof GenericEventSchema.Type

export const UnknownEventSchema = Schema.Struct({
  ...BaseEventFields,
  type: Schema.Unknown,
})

export type UnknownEvent = typeof UnknownEventSchema.Type

export const EventSchema = Schema.Union(
  ErrorEventSchema,
  DefaultEventSchema,
  TransactionEventSchema,
  GenericEventSchema,
  UnknownEventSchema
)

export type RawEvent = typeof EventSchema.Type

export type Event =
  | ErrorEvent
  | DefaultEvent
  | TransactionEvent
  | GenericEvent
  | UnknownEvent

export const EventListSchema = Schema.Array(EventSchema)

export type EventList = typeof EventListSchema.Type

export const EventsResponseSchema = Schema.Struct({
  data: Schema.Array(Schema.Unknown),
  meta: Schema.Struct({
    fields: Schema.Record({ key: Schema.String, value: Schema.String }),
  }),
})

export type EventsResponse = typeof EventsResponseSchema.Type

export const ErrorsSearchResponseSchema = Schema.Struct({
  data: Schema.Array(
    Schema.Struct({
      issue: Schema.String,
      "issue.id": StringOrNumber,
      project: Schema.String,
      title: Schema.String,
      "count()": Schema.Number,
      "last_seen()": Schema.String,
    })
  ),
  meta: Schema.Struct({
    fields: Schema.Record({ key: Schema.String, value: Schema.String }),
  }),
})

export const SpansSearchResponseSchema = Schema.Struct({
  data: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      trace: Schema.String,
      "span.op": Schema.String,
      "span.description": Schema.String,
      "span.duration": Schema.Number,
      transaction: Schema.String,
      project: Schema.String,
      timestamp: Schema.String,
    })
  ),
  meta: Schema.Struct({
    fields: Schema.Record({ key: Schema.String, value: Schema.String }),
  }),
})

// ============================================================================
// Autofix Schemas
// ============================================================================

export const AutofixRunSchema = Schema.Struct({
  run_id: StringOrNumber,
})

export type AutofixRun = typeof AutofixRunSchema.Type

const AutofixStatusSchema = Schema.Literal(
  "PENDING",
  "PROCESSING",
  "IN_PROGRESS",
  "NEED_MORE_INFORMATION",
  "COMPLETED",
  "FAILED",
  "ERROR",
  "CANCELLED",
  "WAITING_FOR_USER_RESPONSE"
)

const AutofixProgressSchema = Schema.Struct({
  data: Schema.NullOr(Schema.Unknown),
  message: Schema.String,
  timestamp: Schema.String,
  type: Schema.Literal("INFO", "WARNING", "ERROR"),
})

const AutofixRunStepBaseFields = {
  type: Schema.String,
  key: Schema.String,
  index: Schema.Number,
  status: AutofixStatusSchema,
  title: Schema.String,
  output_stream: Schema.NullOr(Schema.String),
  progress: Schema.Array(AutofixProgressSchema),
}

export const AutofixRunStepDefaultSchema = Schema.Struct({
  ...AutofixRunStepBaseFields,
  type: Schema.Literal("default"),
  insights: Schema.NullOr(
    Schema.Array(
      Schema.Struct({
        change_diff: Schema.NullOr(Schema.Unknown),
        generated_at_memory_index: Schema.Number,
        insight: Schema.String,
        justification: Schema.String,
        type: Schema.Literal("insight"),
      })
    )
  ),
})

export type AutofixRunStepDefault = typeof AutofixRunStepDefaultSchema.Type

const RelevantCodeFileSchema = Schema.NullOr(
  Schema.Struct({
    file_path: Schema.String,
    repo_name: Schema.String,
  })
)

const RootCauseReproductionSchema = Schema.Struct({
  code_snippet_and_analysis: Schema.String,
  is_most_important_event: Schema.Boolean,
  relevant_code_file: RelevantCodeFileSchema,
  timeline_item_type: Schema.String,
  title: Schema.String,
})

const CauseSchema = Schema.Struct({
  description: Schema.String,
  id: Schema.Number,
  root_cause_reproduction: Schema.Array(RootCauseReproductionSchema),
})

export const AutofixRunStepRootCauseAnalysisSchema = Schema.Struct({
  ...AutofixRunStepBaseFields,
  type: Schema.Literal("root_cause_analysis"),
  causes: Schema.Array(CauseSchema),
})

export type AutofixRunStepRootCauseAnalysis = typeof AutofixRunStepRootCauseAnalysisSchema.Type

const SolutionItemSchema = Schema.Struct({
  code_snippet_and_analysis: Schema.NullOr(Schema.String),
  is_active: Schema.Boolean,
  is_most_important_event: Schema.Boolean,
  relevant_code_file: Schema.Null,
  timeline_item_type: Schema.Literal("internal_code", "repro_test"),
  title: Schema.String,
})

export const AutofixRunStepSolutionSchema = Schema.Struct({
  ...AutofixRunStepBaseFields,
  type: Schema.Literal("solution"),
  solution: Schema.Array(SolutionItemSchema),
})

export type AutofixRunStepSolution = typeof AutofixRunStepSolutionSchema.Type

const AutofixRunStepBaseSchema = Schema.Struct(AutofixRunStepBaseFields)

export const AutofixRunStepSchema = Schema.Union(
  AutofixRunStepDefaultSchema,
  AutofixRunStepRootCauseAnalysisSchema,
  AutofixRunStepSolutionSchema,
  AutofixRunStepBaseSchema
)

export type AutofixRunStep = typeof AutofixRunStepSchema.Type

export const AutofixRunStateSchema = Schema.Struct({
  autofix: Schema.NullOr(
    Schema.Struct({
      run_id: Schema.Number,
      request: Schema.Unknown,
      updated_at: Schema.String,
      status: AutofixStatusSchema,
      steps: Schema.Array(AutofixRunStepSchema),
    })
  ),
})

export type AutofixRunState = typeof AutofixRunStateSchema.Type

// ============================================================================
// Event Attachment Schemas
// ============================================================================

export const EventAttachmentSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  type: Schema.String,
  size: Schema.Number,
  mimetype: Schema.String,
  dateCreated: Schema.String,
  sha1: Schema.String,
  headers: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
})

export type EventAttachment = typeof EventAttachmentSchema.Type

export const EventAttachmentListSchema = Schema.Array(EventAttachmentSchema)

export type EventAttachmentList = typeof EventAttachmentListSchema.Type

// ============================================================================
// Trace Schemas
// ============================================================================

export const TraceMetaSchema = Schema.Struct({
  logs: Schema.Number,
  errors: Schema.Number,
  performance_issues: Schema.Number,
  span_count: Schema.Number,
  transaction_child_count_map: Schema.Array(
    Schema.Struct({
      "transaction.event_id": Schema.NullOr(Schema.String),
      "count()": Schema.Number,
    })
  ),
  span_count_map: Schema.Record({ key: Schema.String, value: Schema.Number }),
})

export type TraceMeta = typeof TraceMetaSchema.Type

// TraceSpan is recursive, using suspend
const TraceSpanStruct = Schema.Struct({
  children: Schema.Array(Schema.suspend((): Schema.Schema<TraceSpan> => TraceSpanSchema)),
  errors: Schema.Array(Schema.Unknown),
  occurrences: Schema.Array(Schema.Unknown),
  event_id: Schema.String,
  transaction_id: Schema.String,
  project_id: StringOrNumber,
  project_slug: Schema.String,
  profile_id: Schema.String,
  profiler_id: Schema.String,
  parent_span_id: Schema.NullOr(Schema.String),
  start_timestamp: Schema.Number,
  end_timestamp: Schema.Number,
  measurements: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Number })),
  duration: Schema.Number,
  transaction: Schema.String,
  is_transaction: Schema.Boolean,
  description: Schema.String,
  sdk_name: Schema.String,
  op: Schema.String,
  name: Schema.String,
  event_type: Schema.String,
  additional_attributes: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
})

export interface TraceSpan extends Schema.Schema.Type<typeof TraceSpanStruct> {}

export const TraceSpanSchema: Schema.Schema<TraceSpan> = TraceSpanStruct

export const TraceIssueSchema = Schema.Struct({
  id: Schema.optional(StringOrNumber),
  issue_id: Schema.optional(StringOrNumber),
  project_id: Schema.optional(StringOrNumber),
  project_slug: Schema.optional(Schema.String),
  title: Schema.optional(Schema.String),
  culprit: Schema.optional(Schema.String),
  type: Schema.optional(Schema.String),
  timestamp: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
})

export type TraceIssue = typeof TraceIssueSchema.Type

export const TraceSchema = Schema.Array(Schema.Union(TraceSpanSchema, TraceIssueSchema))

export type Trace = typeof TraceSchema.Type
