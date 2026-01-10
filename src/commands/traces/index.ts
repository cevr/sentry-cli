import { Command } from "@effect/cli"
import { tracesGetCommand } from "./get.js"

export const tracesCommand = Command.make("traces", {}).pipe(
  Command.withSubcommands([tracesGetCommand]),
  Command.withDescription("Manage traces")
)
