---
id: WHET-0001
title: Create constraint directly from pattern suggestion
status: ready
priority: high
created: 2026-03-12
---

# WHET-0001: Create constraint directly from pattern suggestion

## Problem

The dashboard shows suggested constraint drafts on pattern cards, but there's no way to act on them. Users see the suggestion, then have to manually create the constraint via MCP tools or copy the values by hand.

## Solution

Add a "Create Constraint" button to each pattern card that has a suggested draft. Clicking it opens a pre-filled constraint creation form (or modal) with the suggested title, rule, category, and severity. The user can edit any field before saving. On save, POST to a new `/api/constraint` endpoint, then optionally link the cluster's rejections to the new constraint.

## Tasks

- [ ] Add `POST /api/constraint` endpoint that creates a constraint and returns its ID
- [ ] Add `POST /api/constraint/{id}/link` endpoint to bulk-link rejections
- [ ] Add "Create Constraint" button to pattern cards in overview and rejections pages
- [ ] Build pre-filled creation modal with editable fields
- [ ] After creation, offer to link the pattern's rejections to the new constraint
- [ ] Refresh the pattern list after creation (pattern should disappear or shrink)

## Notes

This is the single highest-value dashboard improvement — it closes the loop from detection to action entirely within the UI.
