---
id: WHET-0003
title: Make stats cards clickable for cross-navigation
status: done
priority: medium
created: 2026-03-12
---

# WHET-0003: Make stats cards clickable for cross-navigation

## Problem

Stats cards on the overview page show counts (total rejections, unencoded, active constraints, etc.) but are static. Users see a count and then have to manually navigate to the relevant page and set filters.

## Solution

Make each stats card a clickable link that navigates to the appropriate page with filters pre-applied. For example, clicking "Unencoded: 12" navigates to the rejections page with the encoded filter set to "no".

## Tasks

- [x] Add click handlers to overview stats cards
- [x] Navigate to rejections page with `encoded=no` filter when clicking "Unencoded"
- [x] Navigate to constraints page with `status=active` when clicking "Active"
- [x] Navigate to constraints page (no filter) when clicking "Constraints"
- [x] Navigate to rejections page (no filter) when clicking "Rejections"
- [x] Add cursor pointer and hover effect to stats cards
- [x] Support passing filter params via `navigateWithFilters()` function

## Notes

Requires a mechanism for cross-page navigation with filter state. Could use URL hash params or a shared state object.
