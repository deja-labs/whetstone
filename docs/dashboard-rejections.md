# Dashboard: Rejections Page

The rejections page provides a filterable, searchable view of all logged rejections. It combines summary statistics, pattern detection, and a card-based list with full filter controls.

Source: `src/cli/dashboard/components/rejections.ts`

## Layout

### 1. Filter Bar

A horizontal bar of filter controls, applied immediately on change:

| Filter | Type | Options |
|--------|------|---------|
| Domain | Searchable dropdown (Choices.js) | All Domains, or any domain present in data (with counts) |
| Encoded status | Dropdown | All, Unencoded, Encoded |
| Sort | Dropdown | Newest First, Oldest First |
| Search | Text input | Free-text search across descriptions and reasoning (debounced 300ms) |
| Clear | Button | Resets all filters to defaults |

Filters compose — setting domain to "frontend" and status to "unencoded" shows only unencoded frontend rejections. The domain dropdown is populated dynamically from the rejections summary API.

### 2. Summary Stats

A 4-column grid of counts reflecting the current dataset (before filtering):

| Stat | Description |
|------|-------------|
| Total | All rejections |
| Unencoded | Rejections without a linked constraint (yellow) |
| Encoded | Rejections linked to a constraint (green) |
| Domains | Number of distinct domains |

### 3. Patterns

Recurring rejection patterns, always visible. Each pattern card shows:

- **Count badge** — orange circle with the number of similar rejections
- **Theme** — auto-extracted keywords describing the pattern
- **Domain and count** with velocity indicator (accelerating/decelerating)
- **Suggested constraint** — if available, shows the draft title and category

When no patterns are detected, shows an empty state message.

### 4. Rejections List

A 2-column responsive grid of rejection cards. Each card displays:

- **Description** — the primary text of the rejection
- **Reasoning** — if present, shown below the description (line-clamped to 2 lines)
- **Domain badge**
- **Encoding status** — either the linked constraint name (with arrow) or a yellow "unencoded" label
- **Time ago** — relative timestamp

Clicking any card opens the rejection detail modal (see [Viewing & Editing](viewing-and-editing.md)).

When filters produce no results, shows "No rejections match the current filters."

## Data Loading

Three API calls in parallel on every load or filter change:

| Endpoint | Purpose |
|----------|---------|
| `/api/rejections/all` + filter params | Filtered rejection list |
| `/api/rejections/summary` | Summary counts and domain list for dropdowns |
| `/api/patterns` | Pattern clusters |

### Filter Parameters

The `/api/rejections/all` endpoint accepts:

| Parameter | Values | Default |
|-----------|--------|---------|
| `domain` | Any domain string | All domains |
| `encoded` | `yes`, `no` | All |
| `sort` | `newest`, `oldest` | `newest` |
| `q` | Search text | None |
