import { Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { SentryApi } from "../../api/client.js"

const queryOption = Options.text("query").pipe(
  Options.withAlias("q"),
  Options.withDescription("Filter organizations by name/slug"),
  Options.optional
)

export const orgsListCommand = Command.make("list", { query: queryOption }, ({ query }) =>
  Effect.gen(function* () {
    const api = yield* SentryApi
    const organizations = yield* api.listOrganizations({
      query: Option.getOrUndefined(query),
    })

    if (organizations.length === 0) {
      yield* Console.log("No organizations found.")
      return
    }

    yield* Console.log("Organizations:")
    yield* Console.log("")

    for (const org of organizations) {
      yield* Console.log(`  ${org.slug}`)
      yield* Console.log(`    Name: ${org.name}`)
      if (org.links?.organizationUrl) {
        yield* Console.log(`    URL: ${org.links.organizationUrl}`)
      }
      if (org.links?.regionUrl) {
        yield* Console.log(`    Region: ${org.links.regionUrl}`)
      }
      yield* Console.log("")
    }

    if (organizations.length === 25) {
      yield* Console.log("(Showing max 25 results. Use --query to filter.)")
    }
  })
).pipe(Command.withDescription("List organizations"))
