// Tailwind v4 @theme configuration for the Whetstone dark theme.
// These tokens become Tailwind utility classes:
//   bg-surface, bg-raised, bg-card, border-edge, text-primary, text-muted, etc.

export const THEME = `
@theme {
  --color-surface: #0d1117;
  --color-raised: #161b22;
  --color-card: #1c2128;
  --color-card-hover: #232a33;
  --color-edge: #30363d;
  --color-edge-subtle: #252b33;
  --color-edge-hover: #444c56;
  --color-primary: #e6edf3;
  --color-muted: #8b949e;
  --color-accent: #58a6ff;
  --color-green: #3fb950;
  --color-yellow: #d29922;
  --color-red: #f85149;
  --color-purple: #bc8cff;
  --color-orange: #f0883e;
  --color-glow-accent: rgba(88,166,255,0.08);
  --color-glow-green: rgba(63,185,80,0.10);
  --color-glow-yellow: rgba(210,153,34,0.10);
  --color-glow-red: rgba(248,81,73,0.10);
  --color-glow-purple: rgba(188,140,255,0.10);
  --color-glow-orange: rgba(240,136,62,0.10);
  --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
`;

// Backward-compat aliases so inline style="var(--accent)" etc. still work in SCRIPT.
// Tailwind @theme creates --color-accent, but old code uses var(--accent).
export const COMPAT_VARS = `
:root {
  --bg-primary: var(--color-surface);
  --bg-secondary: var(--color-raised);
  --bg-card: var(--color-card);
  --border: var(--color-edge);
  --text-primary: var(--color-primary);
  --text-secondary: var(--color-muted);
  --accent: var(--color-accent);
  --accent-green: var(--color-green);
  --accent-yellow: var(--color-yellow);
  --accent-red: var(--color-red);
  --accent-purple: var(--color-purple);
  --accent-orange: var(--color-orange);
  --glow-accent: var(--color-glow-accent);
  --glow-green: var(--color-glow-green);
  --glow-yellow: var(--color-glow-yellow);
  --glow-red: var(--color-glow-red);
  --glow-purple: var(--color-glow-purple);
  --glow-orange: var(--color-glow-orange);
}
`;

// ── Pattern library ──────────────────────────────────────────────────
//
// Hierarchy:  container → page → grid → section/stat/card → content
//
//   .wh-container    Max-width wrapper, centered, responsive horizontal padding
//   .wh-page         Vertical flex column with consistent gap between siblings
//
//   Grid:            Use explicit Tailwind grid-cols-* at each usage site.
//                    See /* Grid */ comment block in CUSTOM_CSS for the palette.
//
//   .wh-section      Boxed content area with heading bar
//   .wh-stat         Individual stat display (value + label + optional delta)
//   .wh-card         Clickable content card with hover state
//   .wh-badge        Inline label (domain, severity, category, status)
//   .wh-tag          Pill-shaped tag (for user-defined tags)
//   .wh-list-item    Compact list row inside a section
//
//   .wh-filter-bar   Filter toolbar with inputs/selects
//   Modal fields use .wh-field-label + .wh-field-value directly
//   .wh-empty        Empty-state placeholder
//
// Spacing: parent containers own the gap between children.
// Children never set margin-bottom to space themselves from siblings.

export const CUSTOM_CSS = `

/* ── Reset ── */
/* Tailwind v4 preflight handles the base reset (box-sizing, margin, padding).
   Do NOT add unlayered resets here — they override Tailwind's
   @layer utilities due to cascade layer precedence. */

.wh-logo-icon {
  width: 36px;
  height: 28px;
  color: #F59E0B;
  flex-shrink: 0;
}

body {
  margin: 0;
  background: radial-gradient(ellipse at top, #111820 0%, var(--color-surface) 60%);
}

/* ── Container ── */

.wh-container {
  @apply max-w-[1600px] w-full mx-auto px-4 md:px-8 lg:px-10;
}

/* ── Page layout ── */

.wh-page {
  @apply flex flex-col gap-4;
}

/* ── Grid ── */
/*
 * No shared grid class. Each usage site declares explicit columns via
 * Tailwind utilities so the intent is always clear:
 *
 *   Stats row (6):  grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4
 *   Stats row (7):  grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4
 *   Stats row (4):  grid grid-cols-2 sm:grid-cols-4 gap-4
 *   Two-panel pair: grid grid-cols-1 lg:grid-cols-2 gap-4
 *   Card list:      grid grid-cols-1 lg:grid-cols-2 gap-4
 *   Full-width:     no grid — stacks naturally inside .wh-page
 *
 * Dynamic show/hide: toggle lg:grid-cols-2 ↔ grid-cols-1 via className,
 * never via inline style.gridTemplateColumns.
 */
.wh-flex-row {
  @apply flex items-center gap-3;
}
.wh-flex-wrap {
  @apply flex flex-wrap gap-2 items-center;
}

/* ── Stat ── */

.wh-stat {
  @apply bg-card border border-edge rounded-lg p-5
         transition-all duration-150
         shadow-[0_1px_2px_rgba(0,0,0,0.15)]
         hover:shadow-[0_2px_8px_rgba(0,0,0,0.25)]
         hover:border-edge-hover;
}
.wh-stat-value {
  @apply text-3xl font-bold font-mono leading-none tracking-tight;
}
.wh-stat-value.good { @apply text-green; }
.wh-stat-value.warn { @apply text-yellow; }
.wh-stat-label {
  @apply text-xs text-muted uppercase tracking-wide mt-2;
}
.wh-stat-delta {
  @apply text-[11px] font-mono mt-2;
}
.wh-stat-clickable {
  @apply cursor-pointer;
}
.wh-stat-clickable:hover {
  @apply border-accent bg-card-hover scale-[1.03];
}
.wh-stat-clickable:active {
  @apply scale-[0.98];
}
.wh-stat-active {
  @apply border-accent bg-glow-accent;
}

/* ── Card ── */

.wh-card {
  @apply bg-card border border-edge rounded-lg p-5 cursor-pointer
         transition-all duration-150 ease-out
         shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.12)];
}
.wh-card:hover {
  @apply bg-card-hover border-edge-hover
         shadow-[0_4px_12px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)];
}
.wh-card:active { @apply scale-[0.995]; }

/* ── Section ── */

.wh-section {
  @apply bg-card border border-edge rounded-lg p-6 relative overflow-hidden;
}
.wh-section::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-edge-hover) 50%, transparent 100%);
}
.wh-section h2 {
  @apply text-xs font-bold uppercase tracking-widest text-muted mb-5 flex items-center gap-2;
}
.wh-section h2::before {
  content: '';
  width: 3px;
  height: 14px;
  background: var(--color-accent);
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── Badge ── */

.wh-badge {
  @apply inline-block text-[11px] font-mono font-medium px-2 py-px rounded-md
         border border-edge text-muted bg-raised;
}
.wh-badge-critical { @apply border-red/30 text-red bg-glow-red; }
.wh-badge-important { @apply border-yellow/30 text-yellow bg-glow-yellow; }
.wh-badge-preference { @apply border-purple/30 text-purple bg-glow-purple; }
.wh-badge-domain {
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}
.wh-badge-domain:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-glow-accent);
}

/* ── Tag ── */

.wh-tag {
  @apply inline-block text-[11px] font-mono px-2 py-1 rounded-full
         bg-glow-accent text-accent border border-accent/20;
}

/* ── List ── */

.wh-list-item {
  @apply py-4 px-3 -mx-3 border-b border-edge-subtle text-sm rounded transition-colors;
}
.wh-list-item:hover { @apply bg-raised; }
.wh-list-item:last-child { @apply border-b-0; }

/* ── Filter bar ── */

.wh-filter-bar {
  @apply flex gap-3 flex-wrap items-center p-4 bg-raised/50 rounded-lg border border-edge-subtle;
}
.wh-filter-select {
  @apply bg-surface text-primary border border-edge rounded-md py-2 pl-3 pr-8
         text-xs font-sans transition-colors
         focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30;
}
.wh-filter-input {
  @apply bg-surface text-primary border border-edge rounded-md py-2 px-3
         text-xs font-sans min-w-[180px] transition-colors
         focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30;
}
.wh-filter-btn {
  @apply bg-surface text-muted border border-edge rounded-md py-2 px-3
         text-xs cursor-pointer font-sans transition-colors
         hover:text-primary hover:border-edge-hover hover:bg-raised
         focus:outline-none focus:ring-1 focus:ring-accent/30;
}

/* ── Modal ── */
/*
 * Modal layout uses Tailwind utility classes directly on each element:
 *   - Container: no padding (header + body own theirs)
 *   - Header:    px-6 pt-6 pb-5, border-b, sticky, backdrop-blur
 *   - Body:      p-6, flex flex-col gap-5 for field spacing
 *   - Fields:    .wh-field-label + .wh-field-value (parent gap handles spacing)
 *   - Sections:  <hr class="border-none border-t border-edge-subtle">
 */

.wh-field-label {
  @apply text-[11px] font-bold text-muted uppercase tracking-widest mb-2 font-mono;
}
.wh-field-value {
  @apply text-sm text-primary leading-relaxed whitespace-pre-wrap break-words;
}
.wh-field-value.mono {
  @apply font-mono text-xs text-muted;
}
.wh-field-value.empty {
  @apply text-muted italic;
}
.wh-field-value code {
  @apply bg-raised py-3 px-3 rounded-md block font-mono text-[13px] leading-normal overflow-x-auto
         border-l-2 border-l-edge-hover;
}

/* ── Editable fields ── */
.wh-field-editable {
  @apply cursor-text rounded-md px-2 py-1 -mx-2 -my-1 transition-colors duration-150;
  border: 1px solid transparent;
}
.wh-field-editable:hover {
  @apply border-edge-hover bg-raised/50;
}
.wh-field-editable:focus {
  outline: none;
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 20%, transparent);
}
.wh-field-saved {
  @apply bg-green/10;
  border-color: var(--green) !important;
}
.wh-inline-edit {
  @apply w-full bg-raised text-primary text-sm rounded-md px-3 py-2 border border-accent
         font-sans leading-relaxed outline-none;
  font-family: inherit;
}
textarea.wh-inline-edit {
  @apply resize-y min-h-[80px];
}
textarea.wh-inline-edit-code {
  @apply font-mono text-[13px];
}
.wh-domain-edit-wrapper {
  @apply w-full;
}
.wh-domain-edit-wrapper .choices {
  @apply mb-0;
}
.wh-domain-edit-wrapper .choices__inner {
  @apply bg-raised border-accent;
}

/* ── Tag input ── */
.wh-tag-input {
  @apply flex flex-wrap items-center gap-1.5 bg-raised border border-accent rounded-md px-2 py-1.5
         cursor-text min-h-[38px];
}
.wh-tag-pill {
  @apply inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full
         bg-glow-accent text-accent border border-accent/20;
}
.wh-tag-remove {
  @apply bg-transparent border-none text-accent/60 cursor-pointer text-sm leading-none
         hover:text-red ml-0.5 p-0;
}
.wh-tag-text {
  @apply bg-transparent border-none outline-none text-primary text-sm flex-1 min-w-[120px] py-0.5;
  font-family: inherit;
}
.wh-tag-text::placeholder {
  @apply text-muted text-xs;
}

/* ── Empty state ── */

.wh-empty {
  @apply text-muted text-sm py-10 text-center border border-dashed border-edge-subtle rounded-lg;
}

/* ── Show more button ── */

.wh-show-more {
  @apply block w-full bg-transparent border-none text-muted p-3 mt-4
         text-xs cursor-pointer rounded-md transition-colors;
}
.wh-show-more:hover {
  @apply text-accent bg-raised;
}

/* ── Utilities (pseudo-elements, transitions, clamp) ── */

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.clickable { cursor: pointer; transition: background-color 0.15s; }
.clickable:hover { background-color: var(--color-raised); border-radius: 6px; }
.clickable:hover .title { color: var(--color-accent); }

.bar-fill-encoded, .bar-fill-unencoded, .gap-bar-fill {
  transition: width 0.4s ease;
}

/* ── Clickable bar segments ── */

.bar-segment-click {
  cursor: pointer;
  transition: opacity 0.15s, filter 0.15s;
}
.bar-segment-click:hover {
  opacity: 0.8;
  filter: brightness(1.3);
}

.bar-row-click {
  cursor: pointer;
  transition: background-color 0.15s;
  border-radius: 6px;
  padding: 4px 0;
  margin: -4px 0;
}
.bar-row-click:hover {
  background-color: var(--color-raised);
}

/* ── Domain bar tooltip ── */

.bar-tooltip {
  position: absolute;
  z-index: 50;
  background: var(--color-card);
  border: 1px solid var(--color-edge);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-family: monospace;
  color: var(--color-primary);
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  opacity: 0;
  transition: opacity 0.15s;
}
.bar-tooltip.visible { opacity: 1; }

/* ── Active domain highlight ── */

.domain-bar-active {
  box-shadow: inset 3px 0 0 var(--color-accent);
  background: var(--color-glow-accent);
  border-radius: 0 6px 6px 0;
}

details summary { list-style: none; }
details summary::before {
  content: '\\25B6';
  font-size: 10px;
  color: var(--color-muted);
  margin-top: 4px;
  transition: transform 0.15s;
  flex-shrink: 0;
}
details[open] summary::before { transform: rotate(90deg); }

.bar-legend span::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 4px;
  vertical-align: middle;
}
.bar-legend .legend-encoded::before { background: var(--color-green); }
.bar-legend .legend-unencoded::before { background: var(--color-orange); }

.pattern-examples div::before {
  content: '\\2022 ';
  color: var(--color-muted);
}

`;

// Choices.js dark theme overrides.
// MUST live in a plain <style> block, NOT inside <style type="text/tailwindcss">.
// Tailwind v4 wraps everything in @layer, which loses to the unlayered Choices.js CDN CSS.
export const CHOICES_CSS = `
/* Set Choices.js CSS custom properties for dark theme */
:root {
  --choices-bg-color: var(--color-surface);
  --choices-bg-color-dropdown: var(--color-card);
  --choices-bg-color-disabled: var(--color-raised);
  --choices-text-color: var(--color-primary);
  --choices-primary-color: var(--color-accent);
  --choices-highlighted-color: rgba(88,166,255,0.15);
  --choices-border-radius: 0.375rem;
}

.choices {
  margin-bottom: 0;
  font-size: 0.75rem;
}
.choices__inner {
  border-color: var(--color-edge);
  padding: 4px 8px 4px 12px;
  min-height: auto;
  font-size: 0.75rem;
  color: var(--color-primary);
}
.choices[data-type*="select-one"] .choices__inner {
  padding-bottom: 4px;
}
.choices__list--single {
  padding: 2px 16px 2px 0;
}
.choices__list--single .choices__item {
  color: var(--color-muted);
}
.choices__list--single .choices__placeholder {
  opacity: 1;
}
.choices__list--dropdown,
.choices__list[aria-expanded] {
  border-color: var(--color-edge);
  z-index: 50;
  width: max-content !important;
  min-width: 100%;
  word-break: normal;
  white-space: nowrap;
}
.choices__list--dropdown .choices__item,
.choices__list[aria-expanded] .choices__item {
  color: var(--color-primary);
  font-size: 0.75rem;
  padding: 8px 12px;
}
.choices__list--dropdown .choices__item--selectable.is-highlighted,
.choices__list[aria-expanded] .choices__item--selectable.is-highlighted {
  color: var(--color-accent);
}
.choices__input {
  color: var(--color-primary);
  font-size: 0.75rem;
}
.choices.is-focused .choices__inner {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px rgba(88,166,255,0.3);
}
.choices[data-type*="select-one"]::after {
  border-color: var(--color-muted) transparent transparent;
}
.choices[data-type*="select-one"].is-open::after {
  border-color: transparent transparent var(--color-muted);
}
.choices__list--dropdown .choices__item--selectable::after {
  display: none;
}
`;
