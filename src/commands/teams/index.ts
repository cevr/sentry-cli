import { Command } from "@effect/cli"
import { teamsListCommand } from "./list.js"
import { teamsCreateCommand } from "./create.js"

export const teamsCommand = Command.make("teams", {}).pipe(
  Command.withSubcommands([teamsListCommand, teamsCreateCommand]),
  Command.withDescription("Manage teams")
)
