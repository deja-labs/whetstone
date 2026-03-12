---
id: WHET-0010
title: Import constraints from another project
status: draft
priority: low
created: 2026-03-12
---

# WHET-0010: Import constraints from another project

## Problem

Constraints are per-project by design, but teams often share patterns across repositories. A constraint proven in one project (e.g. "never use inline styles") is likely valuable in another. Currently there's no way to bootstrap a new project's whetstone database from an existing one.

## Solution

Add a `whetstone import` CLI command that reads constraints from another project's whetstone database or export file and merges them into the current project's database.

## Tasks

- [ ] Add `import` CLI command in `src/cli/`
- [ ] Accept source as a path to another `.whetstone/whetstone.db` or a `.whetstone/exports/*.md` file
- [ ] Import from SQLite: copy constraint rows, generate new ULIDs, preserve all fields
- [ ] Import from markdown export: parse the export format back into constraint objects
- [ ] Skip duplicates — match on title + domain to avoid importing constraints that already exist
- [ ] Add `--domain` filter to import only constraints from a specific domain
- [ ] Add `--dry-run` flag to preview what would be imported
- [ ] Print summary: N imported, N skipped (duplicate), N skipped (filtered)

## Notes

Imported constraints should get new ULIDs and fresh `created_at` timestamps. `times_applied` resets to 0 since usage is project-specific. The `source` field on the constraint could be set to the originating project path for traceability.

This pairs well with the export system — a team could maintain a "shared constraints" repo that other projects import from.
