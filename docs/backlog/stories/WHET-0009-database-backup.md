---
id: WHET-0009
title: Database backup command
status: draft
priority: low
created: 2026-03-12
---

# WHET-0009: Database backup command

## Problem

The whetstone database is a single SQLite file committed to git, but there's no dedicated way to create a point-in-time backup before risky operations (schema migrations, bulk edits, `clear-db`). Users must manually copy the file.

## Solution

Add a `whetstone backup` CLI command that creates a timestamped copy of the database using SQLite's online backup API (via `better-sqlite3`'s `.backup()` method). Store backups in `.whetstone/backups/`.

## Tasks

- [ ] Add `backup` CLI command in `src/cli/`
- [ ] Use `db.backup()` for a safe, consistent backup (handles WAL correctly)
- [ ] Store as `.whetstone/backups/whetstone-YYYY-MM-DDTHH-MM-SS.db`
- [ ] Add `--list` flag to show existing backups with sizes and dates
- [ ] Add `--restore <file>` flag to restore from a backup (with confirmation prompt)
- [ ] Add `.whetstone/backups/` to `.gitignore` — backups are local, not committed
- [ ] Consider auto-backup before migrations in `connection.ts`

## Notes

`better-sqlite3` provides `.backup(destination)` which uses SQLite's online backup API — safe even while the database is in use with WAL mode. This is preferable to a file copy which could capture a partial WAL state.
