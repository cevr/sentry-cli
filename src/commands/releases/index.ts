import { Command } from "@effect/cli"
import { releasesListCommand } from "./list.js"

export const releasesCommand = Command.make("releases", {}).pipe(
  Command.withSubcommands([releasesListCommand]),
  Command.withDescription("Manage releases")
)
