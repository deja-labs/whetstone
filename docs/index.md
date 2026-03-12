# Whetstone Documentation

Whetstone is an MCP server that captures, encodes, and scales the human skill of rejection. When a human says "no" to AI output and explains why, that moment creates knowledge. Whetstone makes it persist and compound.

## Core Concepts

- **Rejection** — A logged instance of rejecting AI output, with a description and optional reasoning
- **Constraint** — A durable rule distilled from rejections, applied proactively by agents before generating output
- **Domain** — A namespace for organizing rejections and constraints (e.g. "frontend", "api-design")
- **Pattern** — A cluster of similar unencoded rejections, surfaced automatically so they can be encoded as constraints

## Architecture

Whetstone runs as an MCP server over stdio. Agents call its tools (`reject`, `constrain`, `get_constraints`, etc.) during conversations. A per-project SQLite database in `.whetstone/whetstone.db` stores everything. The database is committed to git so constraints travel with the code.

A web dashboard provides visibility into the rejection/constraint lifecycle and supports inline editing.

## Documentation

### Dashboard

- [Overview Page](dashboard-overview.md) — Stats, patterns, domain health, and insight cards
- [Rejections Page](dashboard-rejections.md) — Filtered browsing of all rejections
- [Constraints Page](dashboard-constraints.md) — Filtered browsing of all constraints
- [Viewing & Editing](viewing-and-editing.md) — Modal details and inline editing for rejections and constraints

### Internals

- [Pattern Detection](pattern-detection.md) — How the clustering pipeline works: tokenization, TF-IDF, cosine similarity, velocity, leaky detection, and suggested constraint drafts

## MCP Tools

| Tool | Purpose |
|------|---------|
| `reject` | Log a rejection of AI output |
| `constrain` | Create a durable constraint from rejections |
| `get_constraints` | Query active constraints for proactive application |
| `search` | Free-text search across constraints and rejections |
| `applied` | Mark a constraint as applied (usage tracking) |
| `link` | Link rejections to a constraint after the fact |
| `update_constraint` | Refine, supersede, or deprecate a constraint |
| `export` | Export constraints as markdown or JSON |
| `patterns` | Surface clusters of similar unencoded rejections |
| `list` | Browse rejections with filters |
| `stats` | Rejection and constraint statistics |
| `db_path` | Show which database file is in use |

## CLI Commands

| Command | Purpose |
|---------|---------|
| `whetstone init` | Set up `.whetstone/` directory and install git hooks |
| `whetstone dashboard` | Launch the web dashboard (prints URL, does not auto-open browser) |
| `whetstone export` | Export constraints (used by pre-push hook) |
| `whetstone hook` | Install the pre-push git hook |
| `whetstone clear-db` | Reset the database |
| `whetstone help` | Show help text |

All MCP tools are also available as CLI subcommands (e.g. `whetstone reject --domain frontend --desc "..."`) for scripting and debugging.
