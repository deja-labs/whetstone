---
id: WHET-0005
title: Add actions for leaky constraint warnings
status: draft
priority: medium
created: 2026-03-12
---

# WHET-0005: Add actions for leaky constraint warnings

## Problem

When a pattern card shows a "leaky constraint" warning, there's no way to act on it. The user knows the constraint isn't preventing recurring rejections but can't navigate to it or take corrective action from the pattern card.

## Solution

Make the leaky constraint name clickable to open its constraint modal. Add a "Refine" action that opens the constraint in edit mode, pre-scrolling to the rule field. Consider adding a "Supersede" action that creates a new constraint pre-filled with the leaky one's data.

## Tasks

- [ ] Make leaky constraint name clickable (opens constraint modal)
- [ ] Add "Refine" button that opens constraint modal focused on the rule field
- [ ] Consider "Supersede" action for creating a replacement constraint

## Notes

Lower priority than 001/002 since it's an edge case, but important for the constraint lifecycle story.
