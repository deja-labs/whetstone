# Changelog

All notable changes to Whetstone are documented here.

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
