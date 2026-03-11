# Whetstone MCP

A whetstone is a flat stone used to sharpen blades. The blade does the cutting, but without the stone it dulls. The sharpener's skill is knowing the right angle and pressure — judgment that can't be automated, only practiced.

Whetstone MCP applies this metaphor to AI-assisted development. The AI is the blade. Your judgment is the stone. Every time you reject AI output and explain why, you're sharpening the edge. Whetstone captures those moments and turns them into durable, queryable constraints — so the blade stays sharp across conversations, projects, and teams.

## How It Works

1. You reject AI output during a conversation and explain why
2. Whetstone captures the rejection as structured data
3. You (or your agent) distill rejections into constraints — encoded rules
4. Constraints are proactively applied before generating future output
5. Your taste sharpens over time, tracked and versioned alongside your code

## Quick Start

### 1. Install Whetstone

```bash
npm install -g @frontier-collective/whetstone-mcp
```

To update: run the same command again. To uninstall: `npm uninstall -g @frontier-collective/whetstone-mcp`

#### Development install

For contributing or running from source:

```bash
git clone git@github.com:frontier-collective/whetstone-mcp.git ~/tools/whetstone
cd ~/tools/whetstone
make setup
```

To update: `git pull && make build` — the symlink picks up the new build automatically.

### 2. Initialize a project

In any project where you want to use Whetstone:

```bash
cd ~/projects/my-app
whetstone init
```

This creates:

```
my-app/
  .whetstone/
    whetstone.db      # SQLite database for this project's constraints
    exports/          # human-readable snapshots (generated on git push)
```

Commit the `.whetstone/` directory to your repo so constraints travel with the code.

Then install the pre-push git hook:

```bash
whetstone hook
```

This installs `.git/hooks/pre-push-whetstone` (the export script) and a `.git/hooks/pre-push` dispatcher that calls it. If you already have a pre-push hook, you'll be prompted before overwriting.

### 3. Configure your AI agent

Whetstone runs as an MCP server — it starts automatically when your agent starts. Add it to your project's agent config:

#### Claude Code

Create `.claude/settings.json` in your project:

```json
{
  "mcpServers": {
    "whetstone": {
      "command": "whetstone-mcp",
      "env": {
        "WHETSTONE_DB": ".whetstone/whetstone.db"
      }
    }
  }
}
```

If you didn't run `npm link`, reference the build directly:

```json
{
  "mcpServers": {
    "whetstone": {
      "command": "node",
      "args": ["/absolute/path/to/whetstone/dist/index.js"],
      "env": {
        "WHETSTONE_DB": ".whetstone/whetstone.db"
      }
    }
  }
}
```

#### Cursor

In `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "whetstone": {
      "command": "whetstone-mcp",
      "env": {
        "WHETSTONE_DB": ".whetstone/whetstone.db"
      }
    }
  }
}
```

#### Other MCP-compatible agents

Any agent that supports MCP can connect — point it at `whetstone` (or `node /path/to/dist/index.js`) with the `WHETSTONE_DB` environment variable set. The server uses stdio transport.

### 4. Use it

The following tools are now available in your agent conversations:

| Tool | What it does |
|---|---|
| `reject` | Log a rejection — capture what was wrong and why |
| `constrain` | Create a durable constraint from rejections (accepts `rejection_ids` to link them) |
| `get_constraints` | Fetch active constraints before generating output |
| `search` | Free-text search across constraints and rejections |
| `applied` | Mark a constraint as applied (usage tracking) |
| `link` | Link existing rejections to a constraint — closes the flywheel after the fact |
| `update_constraint` | Refine, supersede, or deprecate a constraint |
| `export` | Export constraints as markdown or JSON |
| `patterns` | Surface recurring rejection themes not yet encoded |
| `list` | Browse rejections filtered by domain and encoded/unencoded status |
| `stats` | Get rejection and constraint statistics |
| `db_path` | Returns the resolved database file path (diagnostics) |

No special syntax required — your agent sees these as available tools and can use them naturally in conversation.

## Constraint Lifecycle

```
Rejection (raw event — "this is wrong because...")
  → Constraint (encoded rule, status: active)
    → Graduated (exported to CLAUDE.md, cursor rules, etc.)
      → Deprecated in Whetstone (avoid duplication)
```

Rejections are the raw material. Constraints are the refined product. When a constraint has proven durable, export it to your project's permanent docs and deprecate it in Whetstone.

## Try It: A Complete Walkthrough

This walkthrough uses `make` targets to exercise every tool from the command line. Each `make tool-*` command sends a JSON-RPC call to the MCP server — the same protocol your AI agent uses. By the end you'll have experienced the full rejection-to-constraint flywheel.

**Prerequisites:** Run `make setup` once to install, build, and link.

### Step 1: Log some rejections

Rejections are the raw material. Each one captures a moment where AI output wasn't good enough. Start by logging a few in the `frontend` domain:

```bash
make tool-reject DOMAIN=frontend DESC="Used useEffect to compute derived state"
make tool-reject DOMAIN=frontend DESC="Computed derived values inside useEffect instead of inline"
make tool-reject DOMAIN=frontend DESC="Put a simple string concatenation in a useEffect hook"
```

Each response includes the rejection ID and a suggestion to encode it as a constraint. Notice these three rejections are all about the same underlying issue — useEffect misuse for derived state.

Now log a couple in a different domain:

```bash
make tool-reject DOMAIN=backend DESC="Leaked raw Prisma error message to API response"
make tool-reject DOMAIN=backend DESC="Exposed internal database error in REST endpoint"
```

And one unrelated frontend rejection:

```bash
make tool-reject DOMAIN=frontend DESC="Used a modal dialog for a simple yes/no confirmation"
```

### Step 2: Detect patterns

The `patterns` tool clusters similar rejections by textual similarity within each domain. It's the "you keep saying the same no" detector:

```bash
make tool-patterns
```

You'll see two clusters — the three useEffect rejections grouped together with a shared theme like `"derived, useeffect, state"`, and the two database-error rejections grouped with a theme like `"database, error"`. The modal dialog rejection stands alone (no cluster) because it's about a different issue.

This is the signal that these rejections should become constraints.

### Step 3: Encode a constraint

Pick one of the clusters and articulate a constraint — a durable rule in imperative voice. This is the encoding step, where a vague "I don't like this" becomes a precise instruction:

```bash
make tool-constrain \
  DOMAIN=frontend \
  TITLE="No useEffect for derived state" \
  RULE="Compute derived values inline. Never use useEffect or useMemo for values that can be calculated directly from props or state."
```

The response includes the constraint ID (e.g., `01ABC123`). Copy it for the next step.

### Step 4: Link rejections to the constraint

Now close the flywheel — mark those rejections as "encoded" by linking them to the constraint. Use the rejection IDs from Step 1 (printed when each rejection was logged):

```bash
make tool-link ID=<constraint-id> RID=<first-rejection-id>
make tool-link ID=<constraint-id> RID=<second-rejection-id>
make tool-link ID=<constraint-id> RID=<third-rejection-id>
```

You can also pass `rejection_ids` directly when creating a constraint in Step 3 to link them in one shot — the `constrain` tool accepts an optional `rejection_ids` parameter.

### Step 5: Check the dashboard

```bash
make tool-stats
```

You'll see total rejections, how many are still unencoded (the ones you linked are no longer unencoded), rejections by domain, and most-applied constraints. Run patterns again:

```bash
make tool-patterns
```

The useEffect cluster is gone — those rejections are encoded now. Only the unlinked backend cluster remains, telling you there's still a pattern waiting to be encoded.

### Step 6: Fetch constraints before generating output

This is the highest-value tool. An agent calls `get_constraints` before generating code to pre-apply your taste:

```bash
make tool-get-constraints DOMAIN=frontend
```

Returns your active constraints for the frontend domain, sorted by usage — the most-applied constraints appear first. An agent reads these and applies them proactively, so you don't have to reject the same thing twice.

### Step 7: Track which constraints are actually used

When an agent applies a constraint during generation, it calls `applied` to record that:

```bash
make tool-applied ID=<constraint-id>
make tool-applied ID=<constraint-id>
make tool-applied ID=<constraint-id>
```

Run `make tool-stats` again — the constraint now shows up in "Most applied constraints" with a count of 3. Over time, this data reveals which constraints are actually valuable and which are never used (stale).

### Step 8: Search across everything

Find constraints and rejections by keyword:

```bash
make tool-search QUERY=useEffect
make tool-search QUERY=error
```

Searches across titles, rules, descriptions, reasoning, and tags.

### Step 9: Export for graduation

When a constraint has proven durable, export it to your project's permanent docs:

```bash
make tool-export FORMAT=markdown
make tool-export FORMAT=json
make tool-export DOMAIN=frontend FORMAT=markdown
```

Paste the markdown into your CLAUDE.md, cursor rules, or Codex instructions. Then deprecate the constraint in Whetstone to avoid duplication:

```bash
make tool-update-constraint ID=<constraint-id> TITLE="No useEffect for derived state"
```

### What just happened

You experienced the full flywheel:

```
Reject ("this is wrong") x 3
  -> Patterns detected ("you keep saying the same no")
    -> Constraint encoded ("here's the rule")
      -> Rejections linked (flywheel closed)
        -> Constraint applied (proactive taste)
          -> Usage tracked (what's actually valuable)
            -> Exported (graduated to project docs)
```

In practice, your AI agent does all of this inside the conversation. You reject output naturally, the agent logs it, surfaces patterns, and helps you encode constraints. The Makefile targets are just a way to see the machinery directly.

## Git Integration

The pre-push hook installed by `whetstone hook` automatically:

1. Exports all active constraints to a temp file
2. Compares against the most recent export — skips if nothing changed
3. If changed, saves to `.whetstone/exports/<timestamp>.md` and commits
4. Aborts the push so the snapshot commit is included — push again and it goes through instantly

This means constraint changes are always visible in diffs alongside the code they govern. The timestamped files create a history of how your project's taste evolves.

## Versioning

Whetstone uses semver with automated git-flow releases:

```bash
make version              # show current version
make release patch        # 0.1.0 → 0.1.1
make release minor        # 0.1.0 → 0.2.0
make release major        # 0.1.0 → 1.0.0
```

You must be on the `develop` branch with a clean working tree. The `release` target handles the full git-flow automatically:

1. Builds and runs tests (aborts on failure)
2. Bumps `package.json` and updates `CHANGELOG.md`
3. Creates `release/<version>` branch with a tagged commit
4. Merges to `master` and back to `develop`
5. Cleans up the release branch

When it's done, push and create the GitHub release:

```bash
git push origin master develop --tags
make gh-release
```

### GitHub Releases

`make gh-release` creates a GitHub Release with notes pulled from `CHANGELOG.md`. It only shows tags that don't already have a GitHub Release — if everything is released, it exits cleanly.

```bash
make gh-release              # pick from unreleased tags
make gh-release TAG=v0.0.3   # skip the prompt, release a specific tag
```

The full release workflow:

```
make release patch           # bump, changelog, git-flow merge, tag
git push origin master develop --tags
make gh-release              # create GitHub Release with changelog notes
make npm-publish             # publish to npm registry
```

## CLI Commands

Both `whetstone` and `whetstone-mcp` work as the CLI command — they're identical. Every MCP tool is also available as a CLI subcommand.

### Setup

```bash
whetstone init                    # set up .whetstone/ directory and database
whetstone hook                    # install pre-push git hook (dispatcher pattern)
whetstone dashboard               # launch web dashboard on localhost:1337
whetstone dashboard --port 3000   # use a different port
whetstone --help                  # show all commands and options
```

### Capture

```bash
# Log a rejection
whetstone reject --domain frontend --desc "Used useEffect for derived state" \
  --reasoning "Derived values should be computed inline"

# Encode a constraint (link rejections by ID)
whetstone constrain --domain frontend --category pattern \
  --title "No useEffect for derived state" \
  --rule "Compute derived values inline, never in useEffect" \
  --severity critical --rejection-ids "01ABC123,01DEF456"
```

### Query

```bash
# Fetch constraints before generating code
whetstone get-constraints --domain frontend
whetstone get-constraints --severity critical

# Search across everything
whetstone search --query useEffect
whetstone search --query error --type constraints

# Surface unencoded rejection patterns
whetstone patterns
whetstone patterns --domain backend

# Browse rejections
whetstone list --domain frontend
whetstone list --status unencoded --limit 20

# View statistics
whetstone stats

# Export for graduation to project docs
whetstone export --format markdown
whetstone export --domain backend --format json --output constraints.json
```

### Management

```bash
# Track constraint usage
whetstone applied --id 01ABC123

# Link rejections to a constraint
whetstone link --id 01ABC123 --rejection-ids 01DEF456,01GHI789

# Evolve a constraint
whetstone update-constraint --id 01ABC123 --severity critical
whetstone update-constraint --id 01ABC123 --status deprecated
```

### Diagnostics

```bash
# Show which database file is being used
whetstone db-path

# Wipe all data and recreate empty database (prompts for confirmation)
whetstone clear-db
whetstone clear-db --force    # skip confirmation (for scripting)
```

All commands accept `--db <path>` to override the database location.

## Development

Use `make` targets for all common operations. Run `make help` for the full list.

```bash
make setup         # install, build, and link globally (first time)
make install       # install npm dependencies
make build         # compile TypeScript
make dev           # watch mode
make test          # run tests
make clean         # remove dist/ and test database
make init          # set up .whetstone/ directory and database
make help          # show all targets including MCP tool runners
```

MCP tools can also be exercised directly from the command line via Make:

```bash
make tool-reject DOMAIN=backend DESC="Leaked internal error to client"
make tool-constrain DOMAIN=backend TITLE="No raw errors" RULE="Wrap all API errors"
make tool-get-constraints DOMAIN=backend
make tool-search QUERY=error
make tool-stats
```

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript | Server language — widest MCP SDK support |
| better-sqlite3 | Native SQLite bindings — fast, atomic writes, WAL mode |
| @modelcontextprotocol/sdk | Standard MCP server implementation |
| ulid | Sortable unique identifiers |
