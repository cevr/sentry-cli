import { Prompt } from "@effect/cli"
import { Terminal } from "@effect/platform"
import { Console, Context, Effect, Layer } from "effect"
import { Browser } from "./browser.js"

const TOKEN_URL = "https://sentry.io/settings/account/api/auth-tokens/"

/**
 * Service for obtaining access tokens, either interactively or from other sources
 *
 * The promptForToken method may require Terminal context for interactive prompts.
 * Test implementations can return Effect.succeed with no additional context.
 */
export class TokenProvider extends Context.Tag("TokenProvider")<
  TokenProvider,
  {
    readonly promptForToken: () => Effect.Effect<string, Terminal.QuitException, Terminal.Terminal>
  }
>() {
  /**
   * Live implementation that opens browser and prompts for input
   */
  static live = Layer.effect(
    TokenProvider,
    Effect.gen(function* () {
      const browser = yield* Browser

      return TokenProvider.of({
        promptForToken: () =>
          Effect.gen(function* () {
            yield* Console.log("Opening Sentry to create an access token...")
            yield* Console.log(`URL: ${TOKEN_URL}`)
            yield* Console.log("")
            yield* browser.open(TOKEN_URL)

            const token = yield* Prompt.text({
              message: "Paste your access token",
            })

            return token.trim()
          }),
      })
    })
  )

  /**
   * Test implementation that returns a fixed token
   */
  static test = (token: string) =>
    Layer.succeed(
      TokenProvider,
      TokenProvider.of({
        promptForToken: () => Effect.succeed(token),
      })
    )
}
