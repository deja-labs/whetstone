# Viewing & Editing Rejections and Constraints

The dashboard provides detail modals for viewing and inline-editing individual rejections and constraints. Clicking any rejection or constraint card anywhere in the dashboard opens its modal.

Source: `src/cli/dashboard/index.ts` (modal system and inline editing)

## Opening Modals

- **Rejection modal** — `openRejection(id)` fetches from `/api/rejection/{id}` and renders the detail view
- **Constraint modal** — `openConstraint(id)` fetches from `/api/constraint/{id}` and renders the detail view

Modals are full-screen overlays with a centered content panel. Close by clicking the X button, clicking outside the panel, or pressing Escape.

## Rejection Modal

### Header

Shows "Rejection" as a label and the rejection description as the title.

### Editable Fields

These fields support click-to-edit. Click the value to enter edit mode, and changes save automatically on blur.

| Field | Editor | Notes |
|-------|--------|-------|
| Domain | Searchable dropdown | Choices.js with existing domains from rejections and constraints. Type a new value to create a new domain via an "Add" option. |
| Description | Text input | Cannot be empty |
| Reasoning | Textarea (4 rows) | Optional — renders in the same font as description |
| Raw Output | Textarea (monospace) | Optional — rendered in `<code>` when not editing, monospace textarea when editing |

### Read-Only Fields

| Field | Display |
|-------|---------|
| Encoded By | The linked constraint title (clickable to open that constraint), or "Not yet encoded" |
| ID | Monospace formatted |
| Created | Formatted date and time |

### Actions

- **Unlink** — If the rejection is linked to a constraint, an unlink button appears next to the constraint name. Sends `POST /api/rejection/{id}/unlink` to remove the `constraint_id`.
- **Delete** — A delete button appears in the modal for unlinked rejections only. Rejections linked to a constraint must be unlinked first. Sends `DELETE /api/rejection/{id}`. Also available as an ✕ button on rejection cards in list views when the rejection is unlinked.

## Constraint Modal

### Header

Shows "Constraint" as a label and the constraint title as the title.

### Editable Fields

| Field | Editor | Notes |
|-------|--------|-------|
| Domain | Searchable dropdown | Same behavior as rejection domain — allows creating new domains |
| Severity | Select dropdown | Critical, Important, Preference — color-coded badges |
| Category | Select dropdown | code-quality, pattern, business-logic, framing, reasoning, editorial |
| Status | Select dropdown | Active, Superseded, Deprecated |
| Title | Text input | Cannot be empty |
| Rule | Textarea (4 rows) | Cannot be empty — the constraint itself in imperative voice |
| Reasoning | Textarea (4 rows) | Optional |
| Rejected Example | Textarea (monospace) | Optional — "what bad looks like" |
| Accepted Example | Textarea (monospace) | Optional — "what good looks like" |
| Tags | Tag input | See tag editing below |
| Source | Text input | Optional — where the constraint originated |

### Read-Only Fields

| Field | Display |
|-------|---------|
| Times Applied | Integer count |
| Last Applied | Formatted date, or em-dash if never applied |
| ID | Monospace formatted |
| Created | Formatted date |
| Updated | Formatted date |

### Linked Rejections

A section at the bottom shows all rejections linked to this constraint:

- Each rejection shows its description and is clickable (opens the rejection modal)
- Each has an **Unlink** button to remove the link
- Shows the total count of linked rejections

### Actions

- **Delete** — A delete button appears at the bottom of the modal, but only if the constraint has no linked rejections. Attempting to delete a constraint with linked rejections shows an error message. Sends `DELETE /api/constraint/{id}`.

## Inline Editing System

All editable fields share a common editing pattern.

### Click to Edit

1. Click any editable field value
2. The static text is replaced with the appropriate input control
3. The input is auto-focused and pre-filled with the current value

### Input Types

| Type | Used for | Behavior |
|------|----------|----------|
| `<input type="text">` | Domain, description, title, source | Single-line text |
| `<textarea>` | Reasoning, rule | Multi-line, 4 rows, resizable vertically |
| `<textarea>` (monospace) | Raw output, rejected/accepted example | Multi-line with monospace font via `wh-inline-edit-code` class |
| Choices.js select | Severity, status, category | Dropdown with predefined options |
| Choices.js searchable | Domain | Searchable dropdown with dynamic "Add" option for new domains |
| Tag input | Tags | Custom pill-based input (see below) |

### Save on Blur

When the input loses focus:

1. If the value changed, a PATCH request is sent to the appropriate endpoint
2. On success, the field flashes green briefly (`wh-field-saved` class, 600ms)
3. The input is replaced with the updated static text
4. On error, an alert is shown and the field reverts to its original value

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Blur the input (triggers save) — for single-line inputs only |
| Escape | Cancel the edit, revert to original value |

### Validation

Required fields (domain, description, title, rule) cannot be saved as empty. The save is skipped if the value hasn't changed from the original.

## Tag Editing

Tags on constraints use a specialized pill-based input:

### Display

Tags are shown as individual styled pills with a remove button (x) on each.

### Editing

1. Click the tag area to enter edit mode
2. Type a tag name and press **Enter**, **Tab**, or **Comma** to create a new pill
3. Press **Backspace** on an empty input to remove the last tag
4. Click the **x** on any pill to remove that tag
5. Click outside the tag area to save changes
6. Press **Escape** to cancel and revert

### Processing

- Tags are normalized: lowercased, stripped to alphanumeric characters and hyphens, trimmed
- Duplicate tags are automatically removed
- Stored as a JSON array in the database

## API Endpoints

### Rejection Updates

```
PATCH /api/rejection/{id}
Content-Type: application/json

{ "domain": "new-domain" }
```

Allowed fields: `domain`, `description`, `reasoning`, `raw_output`

### Constraint Updates

```
PATCH /api/constraint/{id}
Content-Type: application/json

{ "severity": "critical" }
```

Allowed fields: `title`, `domain`, `category`, `rule`, `reasoning`, `rejected_example`, `accepted_example`, `tags` (array), `severity`, `status`, `source`

Updates the `updated_at` timestamp automatically.

### Unlinking

```
POST /api/rejection/{id}/unlink
```

Removes the `constraint_id` from the rejection.

### Deleting

```
DELETE /api/rejection/{id}
```

Only succeeds if the rejection is not linked to a constraint.

```
DELETE /api/constraint/{id}
```

Only succeeds if the constraint has no linked rejections.

## Domain Dropdown Behavior

The domain dropdown (used in both rejection and constraint modals) has special behavior:

1. On open, it loads all existing domains from both `/api/rejections/summary` and `/api/constraints/summary`
2. As the user types, it dynamically adds an "Add [typed value]" option at the top of the list
3. Selecting the "Add" option creates a new domain by saving that value
4. This allows domains to be created organically without a separate management UI
