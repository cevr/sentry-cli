# Sentry CLI - Effect TypeScript

A CLI for Sentry built with Effect TypeScript and @effect/cli.

## Commands

```bash
bun run dev <command>     # Run CLI in development
bun run build             # Compile to standalone binary
bun run test              # Run tests
bun run typecheck         # Type check
```

## Project Structure

- `src/main.ts` - CLI entry point and layer composition
- `src/api/client.ts` - SentryApi service (all API methods)
- `src/config/index.ts` - ConfigFile and SentryConfig services
- `src/commands/` - Command implementations
- `tests/` - Workflow-based tests with @effect/vitest

<!-- effect-solutions:start -->
## Effect Best Practices

**Before implementing Effect features**, run `effect-solutions list` and read the relevant guide.

Topics include: services and layers, data modeling, error handling, configuration, testing, HTTP clients, CLIs, observability, and project structure.

**Effect Source Reference:** `~/.local/share/effect-solutions/effect`
Search here for real implementations when docs aren't enough.
<!-- effect-solutions:end -->

## Architecture

### Services

- **ConfigFile** - Reads/writes `~/.config/sentry/config.json`
- **SentryConfig** - Parsed config with token, host, defaults
- **SentryApi** - All Sentry API methods

### Layer Composition

```
BunContext.layer
    ↓
ConfigFile.layer
    ↓
SentryConfig.layer
    ↓
SentryApi.layer
```

### Testing

Tests use workflow-based testing pattern:
- `runCli(args, options)` executes full commands
- Mock layers record service calls
- `expectCall()` / `expectSequence()` assert behavior
- `TestContext.TestContext` provides TestClock for time control
