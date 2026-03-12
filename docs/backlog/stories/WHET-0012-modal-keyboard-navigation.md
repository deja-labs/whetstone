---
id: WHET-0012
title: Keyboard navigation within modals
status: done
priority: low
created: 2026-03-12
---

# WHET-0012: Keyboard navigation within modals

## Problem

Dashboard modals support Escape to close but lack keyboard navigation between fields. Users must click each field to edit it. There's no way to tab through fields or use arrow keys to navigate dropdowns without a mouse. Additionally, pressing Escape while editing a field closes the entire modal instead of just cancelling the edit — the field-level Escape handler fires but the global modal Escape handler also fires immediately after.

## Solution

Add keyboard navigation to the modal editing system so users can move between editable fields with Tab/Shift+Tab and interact with all controls via keyboard. Implement a focus trap to keep keyboard focus within the modal, and fix the Escape key priority so field edits cancel before the modal closes.

## Current Behavior

| Interaction | Keyboard Support |
|---|---|
| Text input editing | Escape cancels, Enter saves |
| Textarea editing | Escape cancels (Enter inserts newline) |
| Choices.js dropdowns (severity, status, category, domain) | Arrow keys, Enter to select, Escape to close — built into Choices.js |
| Tag input | Enter/Tab/Comma adds tag, Backspace removes last, Escape cancels |
| Modal close | Escape (global keydown listener) |
| Field activation | None — click only (`onclick="startEdit(this)"`) |
| Field-to-field navigation | None — must click each field |

## Implementation

Source: `src/cli/dashboard/index.ts` (modal system and inline editing)

### 1. Make editable fields focusable

In `editableField()`, add `tabindex="0"` to the `.wh-field-editable` div so it enters the tab order. Fields already have `onclick="startEdit(this)"` — add a matching `keydown` handler for Enter/Space to trigger `startEdit()`.

```
<div class="wh-field-value wh-field-editable" tabindex="0" ...>
```

Add a delegated keydown listener (similar to the existing delegated click handler for domain badges) that calls `startEdit(el)` when Enter or Space is pressed on a `.wh-field-editable` element.

### 2. Focus indicator styling

In `src/cli/dashboard/theme.ts`, add a visible focus ring to `.wh-field-editable:focus`:

- Use the accent color for the outline (consistent with hover/active states)
- Remove default browser outline and replace with a styled ring
- Subtle background shift to indicate focus (similar to hover state)

### 3. Escape key priority

Fix the global Escape handler so it doesn't close the modal when a field is actively being edited. The field's own Escape handler should cancel the edit first; a second Escape press closes the modal.

Approach: in the global `keydown` listener, check if an edit is active (any `input`, `textarea`, or `.choices.is-open` inside `#modal-content`). If so, let the field handle it and don't call `closeModal()`. The field-level handlers already handle Escape — they just need the global handler to yield.

```javascript
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var modal = document.getElementById('modal-content');
    if (modal && modal.querySelector('input, textarea, .choices.is-open')) {
      return; // let field-level handler deal with it
    }
    closeModal();
  }
});
```

### 4. Focus trap

When the modal is open, Tab/Shift+Tab should cycle through focusable elements within the modal (editable fields, close button, action buttons) without escaping to the page behind it.

Approach: add a keydown listener on the modal overlay that intercepts Tab. Collect all `[tabindex], button, a, input, textarea, select` inside `#modal-content`, and wrap focus from last→first (Tab) or first→last (Shift+Tab).

### 5. Auto-focus first editable field on modal open

When `openRejection()` or `openConstraint()` finishes rendering, focus the first `.wh-field-editable` element so keyboard users can immediately start navigating. Use a `requestAnimationFrame` or short `setTimeout` to ensure the DOM is ready.

### 6. Focus management after save

When a field edit completes (save or cancel), return focus to the field's `.wh-field-editable` container so the user can continue tabbing to the next field. Currently, focus is lost when the input is removed from the DOM.

In `saveField()` and `renderFieldValue()`, after restoring the static display, call `el.focus()` on the editable container.

### 7. Tab behavior in tag input

The tag input currently uses Tab to create a new tag pill, which conflicts with Tab-to-next-field navigation. Change behavior:

- Tab with text in the input: creates a pill (existing behavior, keep it)
- Tab with empty input: blur the tag area and move focus to the next field (new behavior)

## Tasks

- [x] Add `tabindex="0"` to `.wh-field-editable` elements in `editableField()`
- [x] Add delegated keydown handler: Enter/Space on focused `.wh-field-editable` calls `startEdit()`
- [x] Add focus indicator styles for `.wh-field-editable:focus` in theme
- [x] Fix Escape priority: skip `closeModal()` when a field edit is active
- [x] Implement focus trap within modal overlay
- [x] Auto-focus first editable field when modal opens
- [x] Return focus to field container after edit save/cancel
- [x] Fix tag input Tab: empty input should advance to next field
- [x] Test full keyboard-only workflow: open modal → tab to field → Enter to edit → type → Enter to save → Tab to next → Escape to close

## Notes

- Choices.js already handles Arrow keys, Enter, and Escape internally — no changes needed for dropdown navigation
- The `startEdit()` function already guards against double-activation (`if (el.querySelector('input, textarea, select')) return`)
- Non-editable fields (ID, Created, Times Applied) use `modalField()` not `editableField()` — they naturally skip in tab order since they won't have `tabindex`
- Close button and action buttons (Delete, Unlink, Link) are already `<button>` elements and naturally focusable — they'll participate in the focus trap
- The modal content panel scrolls independently — focus trap should account for scrolled-off fields being focusable but not visible (browser handles scroll-into-view on focus automatically)
