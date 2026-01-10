import { Args, Command, Options } from "@effect/cli"
import { Console, Effect, Option } from "effect"
import { ApiError } from "../../errors/index.js"

const queryArg = Args.text({ name: "query" }).pipe(
  Args.withDescription("Search query")
)

const guideOption = Options.text("guide").pipe(
  Options.withAlias("g"),
  Options.withDescription("Filter to specific guide (e.g., python/django, javascript/nextjs)"),
  Options.optional
)

const limitOption = Options.integer("limit").pipe(
  Options.withAlias("l"),
  Options.withDescription("Maximum results (1-10)"),
  Options.withDefault(3)
)

export const docsSearchCommand = Command.make(
  "search",
  { query: queryArg, guide: guideOption, limit: limitOption },
  ({ query, guide, limit }) =>
    Effect.gen(function* () {
      const searchUrl = "https://mcp.sentry.dev/api/search"

      const guideValue = Option.getOrUndefined(guide)
      const requestBody: { query: string; maxResults: number; guide?: string } = {
        query,
        maxResults: Math.min(Math.max(limit, 1), 10),
      }
      if (guideValue) {
        requestBody.guide = guideValue
      }

      const response = yield* Effect.tryPromise({
        try: () =>
          fetch(searchUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }),
        catch: (error) =>
          new ApiError({
            message: `Failed to search docs: ${error instanceof Error ? error.message : String(error)}`,
            cause: error,
          }),
      })

      if (!response.ok) {
        const errorText = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: () => new ApiError({ message: "Failed to read error response" }),
        })
        yield* Console.error(`Search failed: ${response.statusText}`)
        yield* Console.error(`Response: ${errorText}`)
        return
      }

      const data = (yield* Effect.tryPromise({
        try: () => response.json(),
        catch: () =>
          new ApiError({ message: "Failed to parse search response" }),
      })) as {
        query: string
        results: Array<{
          id: string
          url: string
          snippet: string
          relevance: number
        }>
        error?: string
      }

      if (data.error) {
        yield* Console.error(`Search error: ${data.error}`)
        return
      }

      if (data.results.length === 0) {
        yield* Console.log("No documentation found matching your query.")
        return
      }

      yield* Console.log(`Documentation Search Results for "${query}"`)
      if (requestBody.guide) {
        yield* Console.log(`Guide: ${requestBody.guide}`)
      }
      yield* Console.log("")
      yield* Console.log(`Found ${data.results.length} result(s):`)
      yield* Console.log("")

      for (const [index, result] of data.results.entries()) {
        yield* Console.log(`${index + 1}. ${result.url}`)
        yield* Console.log(`   Path: ${result.id}`)
        yield* Console.log(`   Relevance: ${(result.relevance * 100).toFixed(1)}%`)
        if (index < 3) {
          yield* Console.log("")
          yield* Console.log(`   ${result.snippet.substring(0, 200)}...`)
        }
        yield* Console.log("")
      }

      yield* Console.log("Use 'sentry docs get <path>' to fetch full documentation.")
    })
).pipe(Command.withDescription("Search Sentry documentation"))
