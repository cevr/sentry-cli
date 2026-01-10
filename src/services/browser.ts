import { Context, Effect, Layer } from "effect"

export class Browser extends Context.Tag("Browser")<
  Browser,
  {
    readonly open: (url: string) => Effect.Effect<void>
  }
>() {
  static layer = Layer.succeed(
    Browser,
    Browser.of({
      open: (url) =>
        Effect.tryPromise(() => {
          const proc = Bun.spawn(["open", url], { stdout: "ignore", stderr: "ignore" })
          return proc.exited
        }).pipe(Effect.ignore),
    })
  )

  static test = Layer.succeed(
    Browser,
    Browser.of({
      open: () => Effect.void,
    })
  )
}
