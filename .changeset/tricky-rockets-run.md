---
"@cvr/sentry": patch
---

Migrate API validation from Zod to Effect Schema

- Replace all Zod schemas with Effect Schema equivalents
- Add `decodeApi` helper for typed validation errors (`ApiValidationError`)
- Remove zod dependency
