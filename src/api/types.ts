/**
 * TypeScript type definitions derived from Zod schemas.
 */
import type { z } from "zod"
import type {
  AssignedToSchema,
  AutofixRunSchema,
  AutofixRunStateSchema,
  AutofixRunStepDefaultSchema,
  AutofixRunStepRootCauseAnalysisSchema,
  AutofixRunStepSolutionSchema,
  AutofixRunStepSchema,
  ClientKeyListSchema,
  ClientKeySchema,
  ErrorEventSchema,
  DefaultEventSchema,
  TransactionEventSchema,
  GenericEventSchema,
  UnknownEventSchema,
  EventSchema,
  EventListSchema,
  EventAttachmentSchema,
  EventAttachmentListSchema,
  EventsResponseSchema,
  IssueListSchema,
  IssueSchema,
  OrganizationListSchema,
  OrganizationSchema,
  ProjectListSchema,
  ProjectSchema,
  ReleaseListSchema,
  ReleaseSchema,
  TagListSchema,
  TagSchema,
  TeamListSchema,
  TeamSchema,
  TraceMetaSchema,
  TraceSchema,
  TraceSpanSchema,
  TraceIssueSchema,
  UserSchema,
} from "./schema.js"

export type User = z.infer<typeof UserSchema>
export type Organization = z.infer<typeof OrganizationSchema>
export type Team = z.infer<typeof TeamSchema>
export type Project = z.infer<typeof ProjectSchema>
export type ClientKey = z.infer<typeof ClientKeySchema>
export type Release = z.infer<typeof ReleaseSchema>
export type Issue = z.infer<typeof IssueSchema>

export type ErrorEvent = z.infer<typeof ErrorEventSchema>
export type DefaultEvent = z.infer<typeof DefaultEventSchema>
export type TransactionEvent = z.infer<typeof TransactionEventSchema>
export type GenericEvent = z.infer<typeof GenericEventSchema>
export type UnknownEvent = z.infer<typeof UnknownEventSchema>

export type RawEvent = z.infer<typeof EventSchema>
export type Event =
  | ErrorEvent
  | DefaultEvent
  | TransactionEvent
  | GenericEvent
  | UnknownEvent

export type EventAttachment = z.infer<typeof EventAttachmentSchema>
export type Tag = z.infer<typeof TagSchema>
export type AutofixRun = z.infer<typeof AutofixRunSchema>
export type AutofixRunState = z.infer<typeof AutofixRunStateSchema>
export type AutofixRunStep = z.infer<typeof AutofixRunStepSchema>
export type AutofixRunStepDefault = z.infer<typeof AutofixRunStepDefaultSchema>
export type AutofixRunStepRootCauseAnalysis = z.infer<typeof AutofixRunStepRootCauseAnalysisSchema>
export type AutofixRunStepSolution = z.infer<typeof AutofixRunStepSolutionSchema>
export type AssignedTo = z.infer<typeof AssignedToSchema>
export type EventsResponse = z.infer<typeof EventsResponseSchema>

export type OrganizationList = z.infer<typeof OrganizationListSchema>
export type TeamList = z.infer<typeof TeamListSchema>
export type ProjectList = z.infer<typeof ProjectListSchema>
export type ReleaseList = z.infer<typeof ReleaseListSchema>
export type IssueList = z.infer<typeof IssueListSchema>
export type EventList = z.infer<typeof EventListSchema>
export type EventAttachmentList = z.infer<typeof EventAttachmentListSchema>
export type TagList = z.infer<typeof TagListSchema>
export type ClientKeyList = z.infer<typeof ClientKeyListSchema>

export type TraceMeta = z.infer<typeof TraceMetaSchema>
export type TraceSpan = z.infer<typeof TraceSpanSchema>
export type TraceIssue = z.infer<typeof TraceIssueSchema>
export type Trace = z.infer<typeof TraceSchema>
