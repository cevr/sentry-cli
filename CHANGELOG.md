# @cvr/sentry

## 0.1.2

### Patch Changes

- [`42ff372`](https://github.com/cevr/sentry-cli/commit/42ff3729b96f10c4e3af8399954c14cdf52639b9) Thanks [@cevr](https://github.com/cevr)! - Migrate API validation from Zod to Effect Schema

  - Replace all Zod schemas with Effect Schema equivalents
  - Add `decodeApi` helper for typed validation errors (`ApiValidationError`)
  - Remove zod dependency

## 0.1.1

### Patch Changes

- [`43f1a5c`](https://github.com/cevr/sentry-cli/commit/43f1a5c8e6d7303693922d2e272e487a03b94675) Thanks [@cevr](https://github.com/cevr)! - Move CLI entry point to src/ directory for cleaner project structure
