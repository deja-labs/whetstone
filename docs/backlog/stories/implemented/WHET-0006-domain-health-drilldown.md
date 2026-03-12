---
id: WHET-0006
title: Domain health drilldown from overview bars
status: done
priority: medium
created: 2026-03-12
---

# WHET-0006: Domain health drilldown from overview bars

## Problem

The "Rejections by Domain" bar chart on the overview page is informational but not actionable. Clicking a domain bar does nothing. Domain is a core organizing concept in Whetstone but there's no consistent way to drill into a domain from anywhere in the dashboard.

## Solution

Make domain a consistently navigable concept throughout the dashboard. Domain bars, gap bars, and domain badges everywhere become clickable entry points that filter to the relevant rejections or constraints.

## Tasks

### Domain bars (overview)

- [x] Add click handler to domain bars — navigate to rejections page with domain filter
- [x] Split click targets: clicking the green (encoded) segment filters to `domain=X&encoded=yes`, clicking the orange (unencoded) segment filters to `domain=X&encoded=no`
- [x] Add hover tooltip showing exact encoded/unencoded counts
- [x] Add cursor pointer to bar segments
- [x] Highlight the active domain — if returning to overview after a drilldown, visually indicate which domain was last viewed (subtle border or glow)

### Domain gaps (overview)

- [x] Make Domain Gaps bars clickable — navigate to rejections page filtered by `domain=X&encoded=no`
- [x] Add cursor pointer and hover state to gap bars

### Domain badges (global)

- [x] Make domain badges clickable everywhere they appear (rejection cards, constraint cards, list items, modals)
- [x] Clicking a domain badge navigates to rejections page filtered by that domain
- [x] Add hover state to domain badges to indicate clickability

## Notes

Domain is the primary organizing axis in Whetstone. Making it consistently navigable turns the dashboard from a read-only report into an explorable tool. The domain badge change is the highest-leverage piece — it touches every page and makes domain drilldown available from any context.
