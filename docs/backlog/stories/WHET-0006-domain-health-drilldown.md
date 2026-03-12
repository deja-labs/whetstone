---
id: WHET-0006
title: Domain health drilldown from overview bars
status: draft
priority: low
created: 2026-03-12
---

# WHET-0006: Domain health drilldown from overview bars

## Problem

The "Rejections by Domain" bar chart on the overview page is informational but not actionable. Clicking a domain bar does nothing.

## Solution

Make domain bars clickable. Clicking navigates to the rejections page filtered to that domain. Show a tooltip on hover with exact counts (encoded vs unencoded).

## Tasks

- [ ] Add click handler to domain bars — navigate to rejections page with domain filter
- [ ] Add hover tooltip showing exact encoded/unencoded counts
- [ ] Add cursor pointer to bars

## Notes

Small enhancement but improves the overview-to-detail navigation flow.
