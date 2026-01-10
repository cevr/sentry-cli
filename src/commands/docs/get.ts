import { Args, Command } from "@effect/cli"
import { Console, Effect } from "effect"
import { ApiError } from "../../errors/index.js"

const pathArg = Args.text({ name: "path" }).pipe(
  Args.withDescription("Documentation path (e.g., /platforms/javascript/guides/nextjs.md)")
)

export const docsGetCommand = Command.make("get", { path: pathArg }, ({ path }) =>
  Effect.gen(function* () {
    // Ensure path ends with .md
    let docPath = path
    if (!docPath.endsWith(".md")) {
      docPath = `${docPath}.md`
    }

    // Ensure path starts with /
    if (!docPath.startsWith("/")) {
      docPath = `/${docPath}`
    }

    const baseUrl = "https://docs.sentry.io"
    const docUrl = `${baseUrl}${docPath}`

    yield* Console.log(`Fetching: ${docUrl}`)
    yield* Console.log("")

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(docUrl, {
          headers: {
            Accept: "text/plain, text/markdown",
            "User-Agent": "sentry-cli-effect/0.1.0",
          },
        }),
      catch: (error) =>
        new ApiError({
          message: `Failed to fetch documentation: ${error instanceof Error ? error.message : String(error)}`,
          cause: error,
        }),
    })

    if (!response.ok) {
      if (response.status === 404) {
        yield* Console.error("Documentation not found at this path.")
        yield* Console.log("")
        yield* Console.log("Tips:")
        yield* Console.log("- Path should match exactly what's shown in search results")
        yield* Console.log("- Use 'sentry docs search <query>' to find the correct path")
        return
      }

      yield* Console.error(`Failed to fetch: ${response.statusText}`)
      return
    }

    const content = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: () =>
        new ApiError({ message: "Failed to read documentation content" }),
    })

    // Check if we got HTML instead of markdown
    if (
      content.trim().startsWith("<!DOCTYPE") ||
      content.trim().startsWith("<html")
    ) {
      yield* Console.error("Received HTML instead of markdown. The path may be incorrect.")
      yield* Console.log("Make sure to use the .md extension in the path.")
      return
    }

    // Output the markdown content
    yield* Console.log("---")
    yield* Console.log("")
    yield* Console.log(content)
    yield* Console.log("")
    yield* Console.log("---")
  })
).pipe(Command.withDescription("Fetch Sentry documentation page"))
