# Dashboard: Constraints Page

The constraints page provides a comprehensive filtered view of all durable constraints — the encoded rules distilled from rejections. It has the most filter options of any page, reflecting the many dimensions of constraint metadata.

Source: `src/cli/dashboard/components/constraints.ts`

## Layout

### 1. Filter Bar

A horizontal bar with six filter controls, all applied immediately on change:

| Filter | Type | Options |
|--------|------|---------|
| Domain | Searchable dropdown | All Domains, or any domain present (with counts) |
| Severity | Dropdown | All, Critical, Important, Preference |
| Status | Dropdown | All, Active, Deprecated, Superseded |
| Category | Dropdown | All, or any category present (with counts) |
| Sort | Dropdown | Newest First, Most Applied, Severity, Alphabetical |
| Search | Text input | Free-text search across titles, rules, reasoning, and tags (debounced 300ms) |
| Clear | Button | Resets all filters |

The domain and category dropdowns are populated dynamically from the constraints summary API, including counts per value.

### 2. Summary Stats

A 7-column grid showing constraint counts by status and severity:

| Stat | Description |
|------|-------------|
| Total | All constraints |
| Active | Currently active constraints (green) |
| Deprecated | Deprecated constraints |
| Superseded | Superseded constraints |
| Critical | Critical severity (red) |
| Important | Important severity (yellow) |
| Preference | Preference severity (purple) |

### 3. Constraints List

A 2-column responsive grid of constraint cards. Each card displays:

- **Title** — the constraint's short summary
- **Rule** — the constraint itself, in imperative voice (line-clamped to 2 lines)
- **Badges** — domain, severity (color-coded), category, status
- **Tags** — parsed from JSON, displayed as individual badges
- **Usage** — "Applied Nx" or "Never applied"
- **Linked rejections** — count of rejections encoded by this constraint
- **Stale indicator** — shown if the constraint is active, has never been applied, and is older than 7 days
- **Time ago** — relative creation timestamp

Clicking any card opens the constraint detail modal (see [Viewing & Editing](viewing-and-editing.md)).

## Data Loading

Two API calls in parallel on every load or filter change:

| Endpoint | Purpose |
|----------|---------|
| `/api/constraints/all` + filter params | Filtered constraint list |
| `/api/constraints/summary` | Summary counts and domain/category lists for dropdowns |

### Filter Parameters

The `/api/constraints/all` endpoint accepts:

| Parameter | Values | Default |
|-----------|--------|---------|
| `domain` | Any domain string | All domains |
| `severity` | `critical`, `important`, `preference` | All |
| `status` | `active`, `deprecated`, `superseded` | All |
| `category` | Any category string | All |
| `sort` | `newest`, `applied`, `severity`, `alpha` | `newest` |
| `q` | Search text | None |

### Sort Behavior

| Sort | Order |
|------|-------|
| Newest First | `created_at` descending |
| Most Applied | `times_applied` descending |
| Severity | Critical > Important > Preference, then by title |
| Alphabetical | Title ascending |
