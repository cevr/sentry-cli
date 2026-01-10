import { Command } from "@effect/cli"
import { issuesSearchCommand } from "./search.js"
import { issuesGetCommand } from "./get.js"
import { issuesUpdateCommand } from "./update.js"
import { issuesAnalyzeCommand } from "./analyze.js"
import { issuesEventsCommand } from "./events.js"

export const issuesCommand = Command.make("issues", {}).pipe(
  Command.withSubcommands([
    issuesSearchCommand,
    issuesGetCommand,
    issuesUpdateCommand,
    issuesAnalyzeCommand,
    issuesEventsCommand,
  ]),
  Command.withDescription("Manage issues")
)
