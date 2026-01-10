import { Command } from "@effect/cli"
import { projectsListCommand } from "./list.js"
import { projectsCreateCommand } from "./create.js"
import { projectsUpdateCommand } from "./update.js"

export const projectsCommand = Command.make("projects", {}).pipe(
  Command.withSubcommands([
    projectsListCommand,
    projectsCreateCommand,
    projectsUpdateCommand,
  ]),
  Command.withDescription("Manage projects")
)
