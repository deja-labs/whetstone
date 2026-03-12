# Dashboard: Overview Page

The overview page is the default landing page of the dashboard. It provides a high-level view of rejection and constraint health across all domains, highlights patterns that need attention, and surfaces insights about constraint lifecycle.

Source: `src/cli/dashboard/components/overview.ts`

## Layout

The page is organized top-to-bottom by priority — the most actionable information appears first.

### 1. Stats Cards

A 6-column grid of summary statistics:

| Card | Description |
|------|-------------|
| Rejections | Total count with weekly delta |
| Constraints | Total count with weekly delta |
| Active | Active constraints (green highlight) |
| Unencoded | Rejections without a linked constraint (yellow warning if > 0) |
| Coverage | Percentage of rejections that have been encoded (green >= 80%, yellow < 50%) |
| Domains | Number of distinct domains in use |

Weekly deltas show the change in the last 7 days (e.g. "+3 this week").

### 2. Encode These Next (Patterns)

The most actionable section — recurring rejection patterns that haven't been encoded as constraints yet. Shows up to 5 pattern clusters, sorted by urgency (velocity x count).

Each pattern card displays:
- **Domain badge** and **count** of similar rejections
- **Velocity indicator** — whether the pattern is accelerating, steady, or decelerating
- **Keywords** — the auto-extracted theme tokens from the cluster
- **Sample descriptions** — up to 3 rejection descriptions with a "+N more" overflow
- **Leaky constraint warning** — if encoded rejections keep recurring despite an existing constraint
- **Suggested constraint draft** — an auto-generated title, rule, category, and severity ready for review

When no patterns are detected, the section shows an explanatory empty state rather than hiding.

See [Pattern Detection](pattern-detection.md) for how clusters, velocity, and suggestions are computed.

### 3. Rejections by Domain / Most Applied Constraints

A two-column grid:

**Rejections by Domain** — Horizontal stacked bar chart showing encoded (green) vs unencoded (orange) rejections per domain. Bars are proportional to the domain with the most rejections. Includes a legend.

The bar chart is fully interactive:

- **Split click targets** — Clicking the green (encoded) segment navigates to the rejections page filtered by `domain=X&encoded=yes`. Clicking the orange (unencoded) segment filters by `domain=X&encoded=no`.
- **Hover tooltip** — Hovering any bar row shows a tooltip with the exact encoded count, unencoded count, and total.
- **Active domain highlight** — After drilling into a domain and returning to the overview, the last-viewed domain row is highlighted with an accent left border and subtle glow.

**Most Applied Constraints** — List of constraints ordered by `times_applied`, showing title, rule, domain, severity, and apply count. Shows 8 by default with an expandable "Show N more" button.

### 4. Unencoded Rejections / Recently Encoded

A two-column grid:

**Unencoded Rejections** — The 10 most recent rejections without a linked constraint. Each is clickable to open the rejection modal. Expandable if more than 10 exist.

**Recently Encoded** — Rejections that were recently linked to constraints. Clickable to open details.

### 5. Domain Gaps / Ready to Graduate

Conditional section — hidden if both panels are empty.

**Domain Gaps** — Domains where a significant portion of rejections remain unencoded. Shows a red bar proportional to the gap, plus unencoded count and coverage percentage. Surfaces "taste being lost." Each row is clickable — navigates to the rejections page filtered by `domain=X&encoded=no`.

**Ready to Graduate** — Constraints that have been applied frequently enough to be promoted to project docs (CLAUDE.md, steering files). Clickable to open the constraint modal.

### 6. Fading Constraints / Elevation Candidates

**Fading Constraints** — Constraints that were applied in the past but haven't been used recently. Hidden if none exist. Helps identify constraints that may need updating or deprecation.

**Elevation Candidates** — Frequently applied constraints that could benefit from higher severity or promotion.

## Domain Navigation

Domain badges appear throughout the dashboard on rejection cards, constraint cards, pattern cards, and list items. All domain badges are clickable — clicking one navigates to the rejections page filtered by that domain. Badges show a blue hover state (accent border and color) to indicate clickability.

This makes domain a consistently navigable concept: from any card on any page, clicking the domain badge drills into that domain's rejections. The only exception is domain badges inside edit modals, which remain static since you're already viewing a specific item.

## Data Loading

The overview fetches three API calls in parallel on every load:

| Endpoint | Data |
|----------|------|
| `/api/stats` | All statistics, domain bars, applied lists, gaps, graduation, dead, elevation |
| `/api/list?status=unencoded&limit=30` | Unencoded rejection list |
| `/api/patterns` | Pattern clusters with suggested constraints |

The page auto-refreshes every 10 seconds when auto-refresh is enabled (toggled via the nav bar).
