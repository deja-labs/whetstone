---
id: WHET-0003
title: Make stats cards clickable for cross-navigation
status: ready
priority: medium
created: 2026-03-12
---

# WHET-0003: Make stats cards clickable for cross-navigation

## Problem

Stats cards on the overview page show counts (total rejections, unencoded, active constraints, etc.) but are static. Users see a count and then have to manually navigate to the relevant page and set filters.

## Solution

Make each stats card a clickable link that navigates to the appropriate page with filters pre-applied. For example, clicking "Unencoded: 12" navigates to the rejections page with the encoded filter set to "no".

## Tasks

- [ ] Add click handlers to overview stats cards
- [ ] Navigate to rejections page with `encoded=no` filter when clicking "Unencoded"
- [ ] Navigate to constraints page with `status=active` when clicking "Active"
- [ ] Navigate to constraints page (no filter) when clicking "Constraints"
- [ ] Navigate to rejections page (no filter) when clicking "Rejections"
- [ ] Add cursor pointer and hover effect to stats cards
- [ ] Support passing filter params via URL hash or page navigation API

## Notes

Requires a mechanism for cross-page navigation with filter state. Could use URL hash params or a shared state object.
