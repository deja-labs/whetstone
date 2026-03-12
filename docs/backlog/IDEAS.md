# Ideas

Raw ideas for Whetstone improvements. Graduate to a story file in `stories/` when ready to pursue. When an idea is done (graduated or dropped), check the box and move it to the **Done** section at the bottom.

## Branding

- [ ] `WHET-0013` Create favicon and logo — design a simple, recognizable mark for Whetstone (sharpening stone / blade motif). Produce favicon.ico (16×16, 32×32, 48×48), apple-touch-icon (180×180), SVG logo for dashboard header, and a square social/repo image (1280×640). Serve favicon from dashboard HTTP server. Add logo to dashboard header next to "Whetstone" title.

## Dashboard

- [ ] `WHET-0004` Add pagination or infinite scroll to rejection and constraint lists (currently loads all at once)
- [ ] `WHET-0006` Domain health drilldown — make domain bars clickable to navigate to filtered views
- [ ] `WHET-0012` Add keyboard navigation within modals (tab between fields, arrow keys for dropdowns)
- [ ] Add bulk operations — select multiple rejections to link to a constraint at once
- [ ] Show constraint rule preview on hover in rejection cards (where it shows the linked constraint name)
- [ ] Add a "recently changed" indicator to constraint cards when updated_at is recent
- [ ] Add export button to constraint modal — copy as markdown for pasting into CLAUDE.md
- [ ] Dark mode support
- [ ] Add a "duplicate constraint" action for creating variants
- [ ] Show constraint dependency graph — which constraints reference or relate to each other

## Pattern Detection

- [ ] `WHET-0001` Create constraint directly from pattern suggestion
- [ ] `WHET-0005` Add actions for leaky constraint warnings
- [ ] Allow dismissing/ignoring specific patterns from the dashboard
- [ ] Pattern merge — manually combine two pattern clusters that the algorithm split
- [ ] `WHET-0011` Confidence score on suggested constraints — how strong is the signal

## MCP Tools

- [ ] `reject` tool should accept optional `related_constraint_id` to immediately link
- [ ] Add `batch_reject` for logging multiple rejections in one call
- [ ] Add `merge_constraints` tool to combine overlapping constraints

## Infrastructure


- [ ] `WHET-0009` Database backup command
- [ ] `WHET-0010` Import constraints from another project's whetstone database
- [ ] Add API response caching with ETag/If-None-Match

---

## Done

- [x] `WHET-0003` (2026-03-12) Stats cards clickable for cross-navigation and filter toggling
- [x] `WHET-0002` (2026-03-12) Link rejection to constraint from rejection modal
- [x] `WHET-0007` (2026-03-12) AI-generated changelog via Claude API during releases
- [x] `WHET-0008` (2026-03-12) WebSocket support for real-time dashboard updates
