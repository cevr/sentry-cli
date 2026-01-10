# sentry-cli

A modern CLI for interacting with [Sentry](https://sentry.io) built with [Effect](https://effect.website) TypeScript.

## Installation

### Prerequisites

- [Bun](https://bun.sh) runtime

### From Source

```bash
git clone https://github.com/cevr/sentry-cli.git
cd sentry-cli
bun install
bun run build
bun run install:global
```

## Quick Start

```bash
# Authenticate with Sentry
sentry login --token YOUR_SENTRY_TOKEN

# Set default organization
sentry config set org my-organization

# Check authentication
sentry whoami

# List your issues
sentry issues search
```

## Commands

### Authentication & Config

| Command | Description |
|---------|-------------|
| `sentry login --token <token>` | Save access token |
| `sentry whoami` | Show authenticated user |
| `sentry config list` | Show configuration |
| `sentry config get <key>` | Get config value |
| `sentry config set <key> <value>` | Set config value |

### Organizations & Teams

| Command | Description |
|---------|-------------|
| `sentry orgs list` | List organizations |
| `sentry teams list` | List teams |
| `sentry teams create <slug>` | Create a team |

### Projects

| Command | Description |
|---------|-------------|
| `sentry projects list` | List projects |
| `sentry projects create <slug> --team <team>` | Create project |
| `sentry projects update <slug>` | Update project |

### Issues

| Command | Description |
|---------|-------------|
| `sentry issues search` | Search issues |
| `sentry issues get <id>` | Get issue details |
| `sentry issues update <id>` | Update issue status/assignee |
| `sentry issues analyze <id>` | AI analysis with Seer |
| `sentry issues events <id>` | List events for issue |

### Events & Traces

| Command | Description |
|---------|-------------|
| `sentry events search` | Search events |
| `sentry events attachments list <event-id>` | List attachments |
| `sentry events attachments download <event-id> <attachment-id>` | Download attachment |
| `sentry traces get <trace-id>` | Get trace details |

### DSNs & Releases

| Command | Description |
|---------|-------------|
| `sentry dsns list` | List DSNs |
| `sentry dsns create` | Create DSN |
| `sentry releases list` | List releases |

### Documentation

| Command | Description |
|---------|-------------|
| `sentry docs search <query>` | Search Sentry documentation |
| `sentry docs get <url>` | Fetch documentation page |

## Configuration

Configuration is stored at `~/.config/sentry/config.json`:

```json
{
  "accessToken": "sntrys_...",
  "host": "sentry.io",
  "defaultOrg": "my-org",
  "defaultProject": "my-project"
}
```

Set defaults to avoid passing flags repeatedly:

```bash
sentry config set org my-organization
sentry config set project my-project
```

## Common Options

Most commands support these options:

- `--org, -o` - Organization slug (uses `defaultOrg` if not provided)
- `--project, -p` - Project slug (uses `defaultProject` if not provided)
- `--query, -q` - Filter query string
- `--limit, -l` - Maximum results (default: 25)

## Development

```bash
# Install dependencies
bun install

# Run in dev mode
bun run dev <command>

# Run tests
bun run test

# Watch tests
bun run test:watch

# Type check
bun run typecheck

# Build binary
bun run build

# Install globally (creates symlink)
bun run install:global

# Uninstall global
bun run uninstall:global
```

## Architecture

This CLI is built with Effect TypeScript, demonstrating:

- **@effect/cli** - Declarative command and option definitions
- **@effect/platform** - Platform-agnostic file system and HTTP
- **Effect services** - Dependency injection via Context and Layer
- **Typed errors** - Schema.TaggedError for API and config errors

### Project Structure

```
src/
├── main.ts              # CLI entry, layer composition
├── api/
│   ├── client.ts        # SentryApi service
│   ├── schema.ts        # Zod response schemas
│   └── types.ts         # TypeScript types
├── config/
│   ├── file.ts          # ConfigFile service
│   └── config.ts        # SentryConfig service
├── commands/
│   ├── shared.ts        # Shared options & helpers
│   ├── issues/          # Issue commands
│   ├── events/          # Event commands
│   ├── projects/        # Project commands
│   └── ...
└── errors/
    └── index.ts         # Typed error definitions
```

## Getting a Sentry Token

1. Go to [Sentry API Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Create a new token with scopes:
   - `project:read`, `project:write`
   - `team:read`, `team:write`
   - `org:read`
   - `event:read`
   - `alerts:read`

## License

MIT
