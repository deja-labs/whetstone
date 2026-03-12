# Changelog

All notable changes to Whetstone are documented here.

## [0.6.0] - 2026-03-12

### Features

- **[WHET-0008]** Add WebSocket support for real-time dashboard updates — the dashboard now reflects changes instantly without polling, with a live/offline indicator replacing the old auto-refresh toggle
- **[WHET-0002]** Add "Link to Constraint" action in the rejection modal, allowing unencoded rejections to be linked directly to an existing constraint from within the dashboard
- Add delete button for unlinked rejections — rejections not yet linked to a constraint can now be permanently deleted from the rejection modal and the rejections list
- **[WHET-0013]** Add favicon, Apple touch icon, and logo mark to the dashboard; browser tabs and bookmarks now display the Whetstone branding

### Improvements

- **[WHET-0006]** Make domain bars on the Overview page clickable — clicking an encoded or unencoded bar segment navigates to the Rejections page pre-filtered by domain and encoding status; coverage gap rows are also clickable
- **[WHET-0003]** Make stats cards on Overview, Rejections, and Constraints pages clickable for cross-page navigation with pre-applied filters; active filters are highlighted on the stat cards
- **[WHET-0012]** Add full keyboard navigation within modals — editable fields are focusable via Tab, activated with Enter/Space, and Escape cancels edits without closing the modal; Tab cycles focus within the open modal
- Switch dashboard routing from hash-based (`#constraints`) to path-based (`/constraints`, `/rejections`) with proper browser history support
- Replace auto-open browser behavior on dashboard start with a formatted URL/port/DB summary printed to the terminal
- Display domain badges as clickable drilldown links throughout the dashboard (constraint and rejection details navigate to filtered rejections)
- Improve applied-count display with green text styling across constraint cards and overview sections

### Documentation

- Add `docs/backlog/AGENTS.md` describing the backlog workflow for AI agents
- Update dashboard docs to reflect new routing, WebSocket status indicator, and drilldown interactions

### Internal

- Write a `.signal` file on every database write to enable cross-process dashboard notifications without relying on SQLite WAL polling
- Add `scripts/generate-favicons.mjs` and `scripts/generate-logos.mjs` for regenerating brand assets from source SVG
- Add logo concept SVGs and a preview page under `assets/logo-concepts/`


## [0.5.1] - 2026-03-12

### Fixes

- Fix startup failures caused by stale WAL/SHM files left behind after a crash or forceful process termination


## [0.5.0] - 2026-03-12

### Features

- Add inline editing to the dashboard — click any field on a rejection or constraint to edit it in place, with support for text inputs, textareas, dropdowns, domain search, and a tag pill editor
- Add velocity tracking to pattern detection — each cluster now reports whether similar rejections are accelerating or decelerating, and results are sorted by urgency (velocity × count)
- Add leaky constraint detection — pass `include_encoded: true` to surface constraints that aren't preventing the rejections they encode
- Add suggested constraint drafts to pattern clusters — pass `suggest_constraints: true` to get an auto-generated title, rule, category, and severity for each pattern
- [WHET-0007] Add AI-powered changelog generation — `scripts/changelog.mjs` now calls Claude when `ANTHROPIC_API_KEY` is set, with a `--noai` flag and raw commit fallback
- Add `scripts/draft-pr.mjs` — generates a draft GitHub PR description from the current branch using Claude and the project's PR template

### Improvements

- Improve pattern detection accuracy by replacing Jaccard similarity with TF-IDF cosine similarity, adding stemming, bigram support, and noise word filtering
- Improve theme extraction to surface the most discriminative keywords across a cluster rather than only tokens shared by every member
- Move the "Encode These Next" patterns section above the domain/constraint charts on the overview page so it's visible without scrolling
- Show patterns section on the Rejections page unconditionally, with an empty state message when no patterns exist
- Show velocity badges (⚡ accelerating rapidly, ↑ accelerating, ↓ decelerating) on pattern cards in both the overview and rejections views
- Show suggested constraint drafts inline on pattern cards in the dashboard
- Add `--dry-run` flag to `scripts/changelog.mjs` to preview changelog output without writing to disk
- Add WAL checkpoint calls after every write operation so the `.db` file stays current for git commits
- Close the database connection after CLI tool commands complete

### Documentation

- Add full documentation site under `docs/` covering dashboard overview, rejections, constraints, pattern detection, and inline editing
- Add structured backlog under `docs/backlog/` with twelve WHET story files (WHET-0001 through WHET-0012) and an ideas log
- Add `AGENTS.md` with guidance for AI agents working in this repo
- Add `CLAUDE.md` with project conventions including commit message format
- Add GitHub PR template at `.github/pull_request_template.md`


## [0.4.0] - 2026-03-11

- Tightened up the styling of dashboard (7b2deca)
- Dashboard: fix cascade layer conflict and replace auto-fit grid with explicit columns (44d58f0)
- Dashboard: unified grid system and remove presentational web components (26d6eec)
- Dashboard: responsive grid layout with full-width flow (61d64ec)
- Dashboard: enforce 4px grid spacing system (28aa52b)
- Dashboard: spacing and layout overhaul for breathing room (699afa3)
- Added the constraint id to get_constraints output (fad6fa5)
- Dashboard: comprehensive styling overhaul for polish and visual hierarchy (4c50dc0)
- Dashboard: Phase 5 replace CSS with Tailwind v4 utilities, delete legacy file (9f0b87b)
- Dashboard: Phase 4 extract page components into Lit web components (d0f4de9)
- Dashboard: Phase 3 extract app shell and nav into Lit components (5322178)
- Dashboard: Phase 2 extract stat-card and badge Lit components (85ed10c)
- Dashboard: Phase 1 scaffolding for Lit + Tailwind migration (d895048)
- Dashboard: add Rejections page with filters and pattern banners (eb48a1f)
- Dashboard: add Constraints page with header navigation (c64ec36)
- Dashboard: add unlink and delete actions to modals (1ec8a6a)
- Dashboard: add click-to-open modal for full rejection/constraint detail (aeb93c0)
- Dashboard: add Domains stat card, fix layout when sections are hidden (d11598b)


## [0.3.2] - 2026-03-11

- Add Features summary and Dashboard section to README (bd0d924)


## [0.3.1] - 2026-03-11

- Fix stale database connection after clear-db (299a10a)
- Update README with db_path tool, db-path and clear-db commands (da0d656)


## [0.3.0] - 2026-03-11

- Dashboard: add flywheel-driven sections (5bd617c)
- Add right margin to dashboard badge labels (c2aab52)
- Add clear-db command to wipe and recreate database (30bbcb5)
- Add db-path to CLI help output (a7c707f)
- Add db-path CLI command (393cea2)
- Add db_path MCP tool for querying database location (1329fb7)
- Update docs for better-sqlite3, dashboard, and list tool (bac4d10)


## [0.2.0] - 2026-03-11




## [0.1.1] - 2026-03-11

- Improve dashboard with 8 enhancements (405124a)
- Migrate from sql.js to better-sqlite3 (d69da4f)
- Add dashboard footer with version/license and CLI database diagnostics (69a7d1c)
- Add web dashboard for browsing rejections and constraints (3f800ce)
- Add list tool for browsing rejections by domain and status (f885a04)


## [0.1.0] - 2026-03-11

- Initial public release of Whetstone MCP
- MCP server with SQLite backend for capturing and encoding human rejections
- 10 MCP tools: reject, constrain, get_constraints, search, applied, link, update_constraint, export, patterns, stats
- CLI interface with all tools available as subcommands
- Pre-push git hook for automatic constraint exports
- Project initialization with `whetstone init`
- Pattern detection for uncoded rejection clusters
- Markdown and JSON export formats
- Published as @frontier-collective/whetstone-mcp on npm
