import { Args, Command, Options } from "@effect/cli"
import { Console, Effect, Layer, Option } from "effect"
import { FileSystem } from "@effect/platform"
import { SentryApi } from "../../api/client.js"
import { OrgService } from "../../services/org-service.js"
import { ProjectService } from "../../services/project-service.js"
import { orgOption, projectOption } from "../shared.js"
import { ApiError } from "../../errors/index.js"

const outputOption = Options.file("output").pipe(
  Options.withAlias("o"),
  Options.withDescription("Output file path (defaults to attachment name)"),
  Options.optional
)

const eventArg = Args.text({ name: "event-id" }).pipe(
  Args.withDescription("Event ID")
)

const attachmentArg = Args.text({ name: "attachment-id" }).pipe(
  Args.withDescription("Attachment ID")
)

export const eventsAttachmentListCommand = Command.make(
  "list",
  { org: orgOption, project: projectOption, event: eventArg },
  ({ org, project, event }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const organizationSlug = yield* (yield* OrgService).get()
      const projectSlug = yield* (yield* ProjectService).get()

      const attachments = yield* api.listEventAttachments({
        organizationSlug,
        projectSlug,
        eventId: event,
      })

      if (attachments.length === 0) {
        yield* Console.log("No attachments found.")
        return
      }

      yield* Console.log(`Attachments for event ${event}:`)
      yield* Console.log("")

      for (const attachment of attachments) {
        yield* Console.log(`  ${attachment.id}`)
        yield* Console.log(`    Name: ${attachment.name}`)
        yield* Console.log(`    Type: ${attachment.type}`)
        yield* Console.log(`    Size: ${attachment.size} bytes`)
        yield* Console.log(`    MIME: ${attachment.mimetype}`)
        yield* Console.log(`    Created: ${attachment.dateCreated}`)
        yield* Console.log("")
      }
    }).pipe(
      Effect.provide(
        Layer.merge(
          OrgService.make(org),
          Layer.provide(ProjectService.make(project), OrgService.make(org))
        )
      )
    )
).pipe(Command.withDescription("List attachments for an event"))

export const eventsAttachmentDownloadCommand = Command.make(
  "download",
  { org: orgOption, project: projectOption, output: outputOption, event: eventArg, attachment: attachmentArg },
  ({ org, project, output, event, attachment }) =>
    Effect.gen(function* () {
      const api = yield* SentryApi
      const fs = yield* FileSystem.FileSystem
      const organizationSlug = yield* (yield* OrgService).get()
      const projectSlug = yield* (yield* ProjectService).get()

      yield* Console.log(`Downloading attachment ${attachment}...`)

      const result = yield* api.getEventAttachment({
        organizationSlug,
        projectSlug,
        eventId: event,
        attachmentId: attachment,
      })

      const outputPath = Option.getOrElse(output, () => result.filename)

      // Convert blob to Uint8Array and write to file
      const arrayBuffer = yield* Effect.tryPromise({
        try: () => result.blob.arrayBuffer(),
        catch: (error) => new ApiError({
          message: `Failed to read blob: ${error instanceof Error ? error.message : String(error)}`,
          cause: error,
        }),
      })
      const uint8Array = new Uint8Array(arrayBuffer)

      yield* fs.writeFile(outputPath, uint8Array)

      yield* Console.log(`Saved to: ${outputPath}`)
      yield* Console.log(`  Size: ${result.attachment.size} bytes`)
      yield* Console.log(`  MIME: ${result.attachment.mimetype}`)
    }).pipe(
      Effect.provide(
        Layer.merge(
          OrgService.make(org),
          Layer.provide(ProjectService.make(project), OrgService.make(org))
        )
      )
    )
).pipe(Command.withDescription("Download an event attachment"))

export const eventsAttachmentsCommand = Command.make("attachments", {}).pipe(
  Command.withSubcommands([
    eventsAttachmentListCommand,
    eventsAttachmentDownloadCommand,
  ]),
  Command.withDescription("Manage event attachments")
)
