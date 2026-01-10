import { Command } from "@effect/cli"
import { docsSearchCommand } from "./search.js"
import { docsGetCommand } from "./get.js"

export const docsCommand = Command.make("docs", {}).pipe(
  Command.withSubcommands([docsSearchCommand, docsGetCommand]),
  Command.withDescription("Search and read Sentry documentation")
)
