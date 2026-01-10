import { Command } from "@effect/cli"
import { orgsListCommand } from "./list.js"

export const orgsCommand = Command.make("orgs", {}).pipe(
  Command.withSubcommands([orgsListCommand]),
  Command.withDescription("Manage organizations")
)
