# Changelog

All notable changes to Whetstone are documented here.

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
