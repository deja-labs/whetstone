---
id: WHET-0002
title: Link rejection to constraint from rejection modal
status: ready
priority: high
created: 2026-03-12
---

# WHET-0002: Link rejection to constraint from rejection modal

## Problem

Unencoded rejections show "Not yet encoded" in the modal, but there's no way to link them to an existing constraint from the dashboard. Users must use the MCP `link` tool in a conversation.

## Solution

Add a "Link to Constraint" action in the rejection modal when the rejection is unencoded. Show a searchable dropdown of existing constraints (filtered by domain first, then all). On selection, POST to `/api/rejection/{id}/link` with the constraint ID.

## Tasks

- [ ] Add `POST /api/rejection/{id}/link` endpoint (accepts `{ constraint_id }`)
- [ ] Add "Link to Constraint" button/dropdown to rejection modal for unencoded rejections
- [ ] Populate dropdown with constraints from `/api/constraints/all`
- [ ] On link, update the modal to show the newly linked constraint
- [ ] Update linked rejection count in constraint modal if open

## Notes

Pairs with WHET-0001 — together they make the full encode-and-link workflow possible from the dashboard.
