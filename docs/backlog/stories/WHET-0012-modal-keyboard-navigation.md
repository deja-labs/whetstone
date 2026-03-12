---
id: WHET-0012
title: Keyboard navigation within modals
status: draft
priority: low
created: 2026-03-12
---

# WHET-0012: Keyboard navigation within modals

## Problem

Dashboard modals support Escape to close but lack keyboard navigation between fields. Users must click each field to edit it. There's no way to tab through fields or use arrow keys to navigate dropdowns without a mouse.

## Solution

Add keyboard navigation to the modal editing system so users can move between editable fields with Tab/Shift+Tab and interact with all controls via keyboard.

## Tasks

- [ ] Add `tabindex` attributes to all editable field containers in order
- [ ] Tab/Shift+Tab moves focus between editable fields
- [ ] Enter on a focused field enters edit mode (same as click)
- [ ] Arrow keys navigate within Choices.js dropdowns (may already work)
- [ ] Add visible focus indicator styling (outline or highlight) for the active field
- [ ] Ensure tag input is fully keyboard-accessible (already supports Enter/Tab/Backspace)
- [ ] Test full keyboard-only workflow: open modal → edit field → save → next field → close

## Notes

Choices.js already has some keyboard support built in. The main work is making the click-to-edit fields focusable and activatable via keyboard. Keep the implementation simple — add tabindex and keydown handlers to the existing `editableField()` helper.
