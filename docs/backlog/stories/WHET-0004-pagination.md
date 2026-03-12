---
id: WHET-0004
title: Add pagination to rejection and constraint lists
status: ready
priority: medium
created: 2026-03-12
---

# WHET-0004: Add pagination to rejection and constraint lists

## Problem

Both the rejections and constraints pages load all records at once. This works for small datasets but will degrade as the database grows — both in API response time and DOM rendering.

## Solution

Add cursor-based pagination to `/api/rejections/all` and `/api/constraints/all`. Show a "Load more" button at the bottom of each list. Load 50 items per page.

## Tasks

- [ ] Add `limit` and `cursor` params to `/api/rejections/all`
- [ ] Add `limit` and `cursor` params to `/api/constraints/all`
- [ ] Return `next_cursor` in API responses when more results exist
- [ ] Add "Load more" button to rejections page
- [ ] Add "Load more" button to constraints page
- [ ] Preserve existing items when loading more (append, don't replace)
- [ ] Show total count vs loaded count (e.g. "Showing 50 of 127")

## Notes

Cursor-based pagination (using the last item's created_at + id) is more reliable than offset-based when items are being added. Keep it simple — no page numbers, just "load more".
