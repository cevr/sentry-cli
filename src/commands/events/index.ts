import { Command } from "@effect/cli"
import { eventsSearchCommand } from "./search.js"
import { eventsAttachmentsCommand } from "./attachments.js"

export const eventsCommand = Command.make("events", {}).pipe(
  Command.withSubcommands([eventsSearchCommand, eventsAttachmentsCommand]),
  Command.withDescription("Search events and manage attachments")
)
