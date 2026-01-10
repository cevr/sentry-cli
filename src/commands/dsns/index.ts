import { Command } from "@effect/cli"
import { dsnsListCommand } from "./list.js"
import { dsnsCreateCommand } from "./create.js"

export const dsnsCommand = Command.make("dsns", {}).pipe(
  Command.withSubcommands([dsnsListCommand, dsnsCreateCommand]),
  Command.withDescription("Manage DSNs")
)
