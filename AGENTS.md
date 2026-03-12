# AGENTS.md — Whetstone MCP

> Steering file for AI agents working in this codebase.

## What This Is

An MCP server that captures human rejections of AI output and encodes them as durable constraints. TypeScript, better-sqlite3, stdio transport. See `CLAUDE.md` for full architecture and rationale.

## Build

```bash
make build    # compile TypeScript → dist/
make test     # run tests
make setup    # install + build + link globally (first time)
```

Always use `make` targets, not raw `npm` commands.

## Key Rules

- **Strict TypeScript** — `strict: true`, ES modules, no classes for tool handlers
- **No over-engineering** — plain functions, no frameworks, no unnecessary abstractions
- **better-sqlite3** — WAL mode, atomic writes. Never use sql.js
- **ULIDs** for all identifiers — sortable, no coordination
- **Migrations** — append-only in `src/db/migrations.ts`. Never modify existing migrations
- **stdout is sacred** — the MCP JSON-RPC channel. All diagnostics go to stderr
- **Per-project database** — `.whetstone/whetstone.db`, committed to git. No cross-project queries

## Project Structure

```
src/
  index.ts              # MCP server entry point
  db/                   # schema, connection, migrations
  tools/                # one file per MCP tool (reject, constrain, etc.)
  cli/                  # CLI commands and web dashboard
    dashboard.ts        # HTTP server
    dashboard/          # dashboard components and theme
  lib/                  # shared types and utilities
```

## Documentation

Detailed docs live in `docs/`. Read these before making changes to the relevant area:

- [`docs/index.md`](docs/index.md) — project overview, MCP tools reference, CLI commands
- [`docs/dashboard-overview.md`](docs/dashboard-overview.md) — overview page layout and data loading
- [`docs/dashboard-rejections.md`](docs/dashboard-rejections.md) — rejections page filters and API
- [`docs/dashboard-constraints.md`](docs/dashboard-constraints.md) — constraints page filters and API
- [`docs/viewing-and-editing.md`](docs/viewing-and-editing.md) — modal system, inline editing, tag editing
- [`docs/pattern-detection.md`](docs/pattern-detection.md) — clustering pipeline, velocity, leaky detection

## Backlog

Ideas and stories are tracked in `docs/backlog/`. See [`docs/backlog/README.md`](docs/backlog/README.md) for the workflow.

## Dashboard

The dashboard is a single-page app served by `src/cli/dashboard.ts` using vanilla JS web components — no build step, no framework. Each page is a custom element in `src/cli/dashboard/components/`. Styles are in `src/cli/dashboard/theme.ts`.

All dashboard HTML/CSS/JS is generated as template literals in TypeScript — there are no separate `.html` or `.css` files.

## Adding a Migration

1. Append a function to the `migrations` array in `src/db/migrations.ts`
2. Never remove, reorder, or modify existing migrations
3. Use `ALTER TABLE ... ADD COLUMN` for new nullable columns
4. Update types in `src/lib/types.ts` to match
5. Update relevant tools to use new columns

## Adding an MCP Tool

1. Create `src/tools/{name}.ts` with a plain function handler
2. Register the tool schema in `src/index.ts`
3. Add CLI dispatch in `src/cli/tool.ts`
4. Add formatting in `src/cli/format.ts`
