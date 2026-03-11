export function getDashboardHtml(version: string): string {
  const footer = '\n<footer><div>Whetstone MCP v' + version + ' · MIT License</div><div><a href="https://github.com/frontier-collective/whetstone-mcp">GitHub</a> · <a href="https://www.npmjs.com/package/@frontier-collective/whetstone-mcp">npm</a> · Built by <a href="https://github.com/frontier-collective">Frontier Collective</a></div></footer>\n';
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Whetstone Dashboard</title>\n<style>\n'
+ STYLES + '\n</style>\n</head>\n<body>\n<main>\n' + BODY + '\n</main>\n' + footer + '\n<script>\n' + SCRIPT + '\n</script>\n</body>\n</html>';
}

// ── Styles ────────────────────────────────────────────────────────────

const STYLES = `
:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-card: #1c2128;
  --border: #30363d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --accent: #58a6ff;
  --accent-green: #3fb950;
  --accent-yellow: #d29922;
  --accent-red: #f85149;
  --accent-purple: #bc8cff;
  --accent-orange: #f0883e;
  --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  padding: 24px;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

header h1 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

header h1 span {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 14px;
  margin-left: 8px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

#status {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

button {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: background 0.15s;
}

button:hover { background: var(--bg-card); }
button.active { border-color: var(--accent); color: var(--accent); }

.nav-tabs {
  display: flex;
  gap: 4px;
}

.nav-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.nav-tab:hover { background: transparent; color: var(--text-primary); }
.nav-tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-bar select, .filter-bar input[type="text"] {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-family: var(--font-sans);
}

.filter-bar select:focus, .filter-bar input[type="text"]:focus {
  border-color: var(--accent);
  outline: none;
}

.filter-bar input[type="text"] {
  min-width: 180px;
}

.constraints-summary {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.constraint-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.constraint-card:hover { border-color: var(--accent); }

.constraint-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.constraint-rule {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}

.constraint-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.constraint-stats {
  margin-top: 6px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.results-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

@media (max-width: 900px) {
  .constraints-summary { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 600px) {
  .constraints-summary { grid-template-columns: repeat(2, 1fr); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
}

.stat-card .value {
  font-size: 32px;
  font-weight: 700;
  font-family: var(--font-mono);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-card .label {
  font-size: 13px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card .delta {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-card .delta.positive { color: var(--accent-green); }
.stat-card .delta.negative { color: var(--accent-red); }

.stat-card.warn .value { color: var(--accent-yellow); }
.stat-card.good .value { color: var(--accent-green); }

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.two-col .card { margin-bottom: 0; }

.card h2 {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.bar-label {
  width: 120px;
  text-align: right;
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 22px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
}

.bar-fill-encoded {
  height: 100%;
  background: var(--accent-green);
  transition: width 0.4s ease;
}

.bar-fill-unencoded {
  height: 100%;
  background: var(--accent);
  transition: width 0.4s ease;
}

.bar-count {
  width: 60px;
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.bar-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.bar-legend span::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 4px;
  vertical-align: middle;
}

.bar-legend .legend-encoded::before { background: var(--accent-green); }
.bar-legend .legend-unencoded::before { background: var(--accent); }

.list-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.list-item:last-child { border-bottom: none; }

.list-item .title {
  color: var(--text-primary);
  font-weight: 500;
}

.list-item .meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 2px 6px;
  margin-right: 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.badge.critical { color: var(--accent-red); border-color: var(--accent-red); }
.badge.important { color: var(--accent-yellow); border-color: var(--accent-yellow); }
.badge.preference { color: var(--accent-purple); border-color: var(--accent-purple); }

details {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

details:last-child { border-bottom: none; }

details summary {
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

details summary::before {
  content: '\\25B6';
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 4px;
  transition: transform 0.15s;
  flex-shrink: 0;
}

details[open] summary::before { transform: rotate(90deg); }

details .detail-body {
  margin-top: 8px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.detail-body .detail-field {
  margin-bottom: 8px;
}

.detail-body .detail-field:last-child { margin-bottom: 0; }

.detail-body .detail-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.empty {
  color: var(--text-secondary);
  font-size: 14px;
  font-style: italic;
  padding: 20px 0;
  text-align: center;
}

.count-badge {
  display: inline-block;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--accent);
  margin-left: 4px;
}

.show-more-btn {
  display: block;
  width: 100%;
  background: none;
  border: 1px dashed var(--border);
  color: var(--text-secondary);
  padding: 8px;
  margin-top: 8px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
}

.show-more-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: none;
}

.pattern-cluster {
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 3px solid var(--accent-orange);
}

.pattern-cluster .pattern-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.pattern-cluster .pattern-count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent-orange);
  font-weight: 600;
}

.pattern-cluster .pattern-theme {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.pattern-cluster .pattern-examples {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
}

.pattern-cluster .pattern-examples div {
  padding: 2px 0;
}

.pattern-cluster .pattern-examples div::before {
  content: '\\2022 ';
  color: var(--text-secondary);
}

.domain-gap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.domain-gap:last-child { border-bottom: none; }

.domain-gap .gap-domain {
  width: 120px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-primary);
  flex-shrink: 0;
}

.domain-gap .gap-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.domain-gap .gap-bar-fill {
  height: 100%;
  background: var(--accent-red);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.domain-gap .gap-stats {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  white-space: nowrap;
}

.graduation-rule {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
  padding-left: 4px;
  border-left: 2px solid var(--accent-green);
  line-height: 1.4;
}

.section-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 100%;
  max-width: 720px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--bg-card);
  border-radius: 12px 12px 0 0;
  z-index: 1;
}

.modal-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
  text-transform: none;
  letter-spacing: 0;
}

.modal-header .modal-type {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
  padding: 0 0 0 16px;
  line-height: 1;
  flex-shrink: 0;
}

.modal-close:hover { color: var(--text-primary); background: none; }

.modal-body {
  padding: 20px 24px;
}

.modal-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.modal-field {
  margin-bottom: 16px;
}

.modal-field:last-child { margin-bottom: 0; }

.modal-field .field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  font-family: var(--font-mono);
}

.modal-field .field-value {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.modal-field .field-value.mono {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.modal-field .field-value.empty {
  color: var(--text-secondary);
  font-style: italic;
}

.modal-field .field-value code {
  background: var(--bg-secondary);
  padding: 8px 12px;
  border-radius: 6px;
  display: block;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
}

.modal-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.modal-tags .tag {
  display: inline-block;
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--accent);
  border: 1px solid var(--border);
}

.modal-linked {
  margin-top: 8px;
}

.modal-linked .linked-item {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: border-color 0.15s;
  border: 1px solid transparent;
}

.modal-linked .linked-item:hover {
  border-color: var(--accent);
}

.modal-linked .linked-item .linked-desc {
  font-size: 13px;
  color: var(--text-primary);
}

.modal-linked .linked-item .linked-meta {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.modal-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 16px 0;
}

.clickable { cursor: pointer; }
.clickable:hover .title { color: var(--accent); }

footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  line-height: 1.8;
}

footer a {
  color: var(--accent);
  text-decoration: none;
}

footer a:hover { text-decoration: underline; }

@media (max-width: 1100px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 900px) {
  .two-col { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
`;

// ── Body ──────────────────────────────────────────────────────────────

const BODY = `
<header>
  <h1>Whetstone <span>Dashboard</span></h1>
  <nav class="nav-tabs">
    <button class="nav-tab active" onclick="switchPage('overview')">Overview</button>
    <button class="nav-tab" onclick="switchPage('constraints')">Constraints</button>
  </nav>
  <div class="header-controls">
    <span id="status">Loading...</span>
    <button onclick="refresh()">Refresh</button>
    <button id="auto-btn" class="active" onclick="toggleAuto()">Auto: ON</button>
  </div>
</header>

<div id="page-overview" class="page">

<section class="stats-grid" id="stats-cards"></section>

<section class="two-col">
  <div class="card">
    <h2>Rejections by Domain</h2>
    <div id="domain-bars"></div>
  </div>
  <div class="card">
    <h2>Most Applied Constraints</h2>
    <div id="applied-list"></div>
  </div>
</section>

<section class="two-col">
  <div class="card">
    <h2>Unencoded Rejections</h2>
    <div id="unencoded-list"></div>
  </div>
  <div class="card">
    <h2>Recently Encoded</h2>
    <div id="recently-encoded-list"></div>
  </div>
</section>

<section class="card" id="patterns-section" style="display:none">
  <h2>Encode These Next <span class="section-label">— recurring rejection patterns without constraints</span></h2>
  <div id="patterns-list"></div>
</section>

<section class="two-col" id="gaps-graduation-section" style="display:none">
  <div class="card" id="domain-gaps-section">
    <h2>Domain Gaps <span class="section-label">— taste being lost</span></h2>
    <div id="domain-gaps-list"></div>
  </div>
  <div class="card" id="graduation-section">
    <h2>Ready to Graduate <span class="section-label">— move to CLAUDE.md</span></h2>
    <div id="graduation-list"></div>
  </div>
</section>

<section class="two-col" id="dead-elevation-section">
  <div class="card" id="dead-section" style="display:none">
    <h2>Fading Constraints <span class="section-label">— applied before, silent now</span></h2>
    <div id="dead-list"></div>
  </div>
  <div class="card">
    <h2>Elevation Candidates</h2>
    <div id="elevation-list"></div>
  </div>
</section>

</div>

<div id="page-constraints" class="page" style="display:none">

<div class="filter-bar" id="constraints-filters">
  <select id="cf-domain" onchange="applyConstraintFilters()"><option value="">All Domains</option></select>
  <select id="cf-severity" onchange="applyConstraintFilters()">
    <option value="">All Severities</option>
    <option value="critical">Critical</option>
    <option value="important">Important</option>
    <option value="preference">Preference</option>
  </select>
  <select id="cf-status" onchange="applyConstraintFilters()">
    <option value="">All Statuses</option>
    <option value="active">Active</option>
    <option value="deprecated">Deprecated</option>
    <option value="superseded">Superseded</option>
  </select>
  <select id="cf-category" onchange="applyConstraintFilters()"><option value="">All Categories</option></select>
  <select id="cf-sort" onchange="applyConstraintFilters()">
    <option value="newest">Newest First</option>
    <option value="applied">Most Applied</option>
    <option value="severity">Severity</option>
    <option value="alpha">Alphabetical</option>
  </select>
  <input type="text" id="cf-search" placeholder="Search constraints..." oninput="debounceConstraintSearch()">
  <button onclick="clearConstraintFilters()">Clear</button>
</div>

<div class="constraints-summary" id="constraints-summary"></div>
<div id="constraints-count" class="results-count"></div>
<div id="constraints-list"></div>

</div>

<div id="modal-overlay" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeModal()">
  <div class="modal" id="modal-content"></div>
</div>
`;

// ── Script ────────────────────────────────────────────────────────────

const SCRIPT = `
var autoRefresh = true;
var refreshTimer = null;

function esc(s) {
  if (!s) return '';
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function timeAgo(iso) {
  if (!iso) return '';
  var ms = Date.now() - new Date(iso).getTime();
  var days = Math.floor(ms / 86400000);
  if (days > 0) return days + 'd ago';
  var hrs = Math.floor(ms / 3600000);
  if (hrs > 0) return hrs + 'h ago';
  var mins = Math.floor(ms / 60000);
  return mins + 'm ago';
}

function severityBadge(sev) {
  return '<span class="badge ' + esc(sev) + '">' + esc(sev) + '</span>';
}

function domainBadge(domain) {
  return '<span class="badge">' + esc(domain) + '</span>';
}

async function fetchJson(path) {
  var res = await fetch(path);
  return res.json();
}

function formatDate(iso) {
  if (!iso) return null;
  try {
    var d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  } catch(e) { return iso; }
}

function modalField(label, value, opts) {
  opts = opts || {};
  if (!value && !opts.showEmpty) return '';
  var cls = opts.mono ? ' mono' : '';
  var val;
  if (!value) {
    val = '<div class="field-value empty">—</div>';
  } else if (opts.code) {
    val = '<div class="field-value"><code>' + esc(value) + '</code></div>';
  } else if (opts.html) {
    val = '<div class="field-value' + cls + '">' + value + '</div>';
  } else {
    val = '<div class="field-value' + cls + '">' + esc(value) + '</div>';
  }
  return '<div class="modal-field"><div class="field-label">' + esc(label) + '</div>' + val + '</div>';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

async function unlinkRejection(rejectionId) {
  if (!confirm('Unlink this rejection from its constraint?')) return;
  try {
    var res = await fetch('/api/rejection/' + encodeURIComponent(rejectionId) + '/unlink', { method: 'POST' });
    var data = await res.json();
    if (!res.ok) { alert(data.error || 'Unknown error'); return; }
    openRejection(rejectionId);
    refresh();
  } catch(err) { alert(err.message); }
}

async function unlinkFromConstraint(rejectionId, constraintId) {
  if (!confirm('Unlink this rejection from the constraint?')) return;
  try {
    var res = await fetch('/api/rejection/' + encodeURIComponent(rejectionId) + '/unlink', { method: 'POST' });
    var data = await res.json();
    if (!res.ok) { alert(data.error || 'Unknown error'); return; }
    openConstraint(constraintId);
    refresh();
  } catch(err) { alert(err.message); }
}

async function deleteConstraint(constraintId) {
  if (!confirm('Permanently delete this constraint? This cannot be undone.')) return;
  try {
    var res = await fetch('/api/constraint/' + encodeURIComponent(constraintId), { method: 'DELETE' });
    var data = await res.json();
    if (!res.ok) { alert(data.error || 'Unknown error'); return; }
    closeModal();
    refresh();
  } catch(err) { alert(err.message); }
}

async function openRejection(id) {
  var overlay = document.getElementById('modal-overlay');
  var content = document.getElementById('modal-content');
  content.innerHTML = '<div class="modal-body"><div class="empty">Loading...</div></div>';
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  try {
    var r = await fetchJson('/api/rejection/' + encodeURIComponent(id));
    var html = '<div class="modal-header"><div><div class="modal-type">Rejection</div><h2>' + esc(r.description) + '</h2></div><button class="modal-close" onclick="closeModal()">\\u00D7</button></div>';
    html += '<div class="modal-body">';
    html += '<div class="modal-badges">' + domainBadge(r.domain) + '</div>';
    html += modalField('Description', r.description);
    html += modalField('Reasoning', r.reasoning, { showEmpty: true });
    html += modalField('Raw Output', r.raw_output, { code: true, showEmpty: true });
    if (r.constraint_id) {
      html += '<div class="modal-field"><div class="field-label">Encoded By</div><div class="field-value" style="display:flex;align-items:center;gap:12px"><a href="#" onclick="event.preventDefault();openConstraint(\\'' + esc(r.constraint_id) + '\\')" style="color:var(--accent);text-decoration:none;font-family:var(--font-mono);font-size:12px">' + esc(r.constraint_id) + ' \\u2192 View constraint</a><button onclick="unlinkRejection(\\'' + esc(r.id) + '\\')" style="color:#e06c75;border:1px solid #e06c75;background:transparent;border-radius:4px;font-size:11px;padding:2px 8px;cursor:pointer">Unlink</button></div></div>';
    } else {
      html += modalField('Encoded By', 'Not yet encoded', { showEmpty: true });
    }
    html += '<hr class="modal-divider">';
    html += modalField('ID', r.id, { mono: true });
    html += modalField('Created', formatDate(r.created_at), { mono: true });
    html += '</div>';
    content.innerHTML = html;
  } catch(err) {
    content.innerHTML = '<div class="modal-body"><div class="empty">Error: ' + esc(err.message) + '</div></div>';
  }
}

async function openConstraint(id) {
  var overlay = document.getElementById('modal-overlay');
  var content = document.getElementById('modal-content');
  content.innerHTML = '<div class="modal-body"><div class="empty">Loading...</div></div>';
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  try {
    var c = await fetchJson('/api/constraint/' + encodeURIComponent(id));
    var html = '<div class="modal-header"><div><div class="modal-type">Constraint</div><h2>' + esc(c.title) + '</h2></div><button class="modal-close" onclick="closeModal()">\\u00D7</button></div>';
    html += '<div class="modal-body">';
    html += '<div class="modal-badges">' + domainBadge(c.domain) + severityBadge(c.severity) + '<span class="badge">' + esc(c.category) + '</span><span class="badge">' + esc(c.status) + '</span></div>';
    html += modalField('Rule', c.rule);
    html += modalField('Reasoning', c.reasoning, { showEmpty: true });
    html += modalField('Bad Example', c.rejected_example, { code: true, showEmpty: true });
    html += modalField('Good Example', c.accepted_example, { code: true, showEmpty: true });
    // Tags
    var tags = null;
    try { tags = c.tags ? JSON.parse(c.tags) : null; } catch(e) { tags = c.tags ? [c.tags] : null; }
    if (tags && tags.length > 0) {
      var tagsHtml = '<div class="modal-tags">';
      for (var t = 0; t < tags.length; t++) tagsHtml += '<span class="tag">' + esc(tags[t]) + '</span>';
      tagsHtml += '</div>';
      html += '<div class="modal-field"><div class="field-label">Tags</div>' + tagsHtml + '</div>';
    } else {
      html += modalField('Tags', null, { showEmpty: true });
    }
    html += modalField('Source', c.source, { showEmpty: true });
    html += '<hr class="modal-divider">';
    html += modalField('Times Applied', String(c.times_applied || 0), { mono: true });
    html += modalField('Last Applied', c.last_applied_at ? formatDate(c.last_applied_at) : null, { mono: true, showEmpty: true });
    html += modalField('ID', c.id, { mono: true });
    html += modalField('Created', formatDate(c.created_at), { mono: true });
    html += modalField('Updated', formatDate(c.updated_at), { mono: true });
    // Linked rejections
    var linked = c.linked_rejections || [];
    html += '<hr class="modal-divider">';
    html += '<div class="modal-field"><div class="field-label">Linked Rejections (' + linked.length + ')</div>';
    if (linked.length > 0) {
      html += '<div class="modal-linked">';
      for (var i = 0; i < linked.length; i++) {
        var lr = linked[i];
        html += '<div class="linked-item" onclick="openRejection(\\'' + esc(lr.id) + '\\')">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">';
        html += '<div><div class="linked-desc">' + esc(lr.description) + '</div>';
        html += '<div class="linked-meta">' + esc(lr.domain) + ' \\u00B7 ' + timeAgo(lr.created_at) + '</div></div>';
        html += '<button onclick="event.stopPropagation();unlinkFromConstraint(\\'' + esc(lr.id) + '\\',\\'' + esc(c.id) + '\\')" style="color:#e06c75;border:1px solid #e06c75;background:transparent;border-radius:4px;font-size:10px;padding:2px 6px;cursor:pointer;flex-shrink:0">Unlink</button>';
        html += '</div></div>';
      }
      html += '</div>';
    } else {
      html += '<div class="field-value empty">\\u2014</div>';
    }
    html += '</div>';
    if (linked.length === 0) {
      html += '<div style="text-align:center;padding:12px 0">';
      html += '<button onclick="deleteConstraint(\\'' + esc(c.id) + '\\')" style="color:#e06c75;border:1px solid #e06c75;background:transparent;border-radius:6px;font-size:13px;padding:8px 16px;cursor:pointer">Delete Constraint</button>';
      html += '<div style="font-size:11px;color:var(--text-secondary);margin-top:6px">No linked rejections \\u2014 safe to delete</div>';
      html += '</div>';
    }
    html += '</div>';
    content.innerHTML = html;
  } catch(err) {
    content.innerHTML = '<div class="modal-body"><div class="empty">Error: ' + esc(err.message) + '</div></div>';
  }
}

function deltaHtml(n, label) {
  if (!n) return '';
  var cls = n > 0 ? 'positive' : 'negative';
  var sign = n > 0 ? '+' : '';
  return '<div class="delta ' + cls + '">' + sign + n + ' ' + label + '</div>';
}

function renderStatsCards(s) {
  var el = document.getElementById('stats-cards');
  var unencodedClass = s.unencoded_rejections > 0 ? ' warn' : '';
  var encoded = s.total_rejections - s.unencoded_rejections;
  var coveragePct = s.total_rejections > 0 ? Math.round((encoded / s.total_rejections) * 100) : 0;
  var coverageClass = coveragePct >= 80 ? ' good' : coveragePct >= 50 ? '' : ' warn';
  var wd = s.week_delta || {};
  var domainCount = (s.rejections_by_domain || []).length;
  el.innerHTML =
    '<div class="stat-card"><div class="value">' + s.total_rejections + '</div><div class="label">Rejections</div>' + deltaHtml(wd.rejections, 'this week') + '</div>' +
    '<div class="stat-card"><div class="value">' + s.total_constraints + '</div><div class="label">Constraints</div>' + deltaHtml(wd.constraints, 'this week') + '</div>' +
    '<div class="stat-card good"><div class="value">' + s.active_constraints + '</div><div class="label">Active</div></div>' +
    '<div class="stat-card' + unencodedClass + '"><div class="value">' + s.unencoded_rejections + '</div><div class="label">Unencoded</div></div>' +
    '<div class="stat-card' + coverageClass + '"><div class="value">' + coveragePct + '%</div><div class="label">Coverage</div>' + deltaHtml(wd.encoded, 'encoded this week') + '</div>' +
    '<div class="stat-card"><div class="value">' + domainCount + '</div><div class="label">Domains</div></div>';
}

function renderDomainBars(s) {
  var el = document.getElementById('domain-bars');
  var domains = s.rejections_by_domain || [];
  if (domains.length === 0) {
    el.innerHTML = '<div class="empty">No rejections yet</div>';
    return;
  }
  // Build encoded lookup
  var encodedMap = {};
  var enc = s.encoded_by_domain || [];
  for (var j = 0; j < enc.length; j++) {
    encodedMap[enc[j].domain] = enc[j].count;
  }
  var max = Math.max.apply(null, domains.map(function(d) { return d.count; }));
  var html = '<div class="bar-legend"><span class="legend-encoded">Encoded</span><span class="legend-unencoded">Unencoded</span></div>';
  for (var i = 0; i < domains.length; i++) {
    var d = domains[i];
    var encodedCount = encodedMap[d.domain] || 0;
    var unencodedCount = d.count - encodedCount;
    var encodedPct = max > 0 ? Math.round((encodedCount / max) * 100) : 0;
    var unencodedPct = max > 0 ? Math.round((unencodedCount / max) * 100) : 0;
    html += '<div class="bar-row">' +
      '<div class="bar-label">' + esc(d.domain) + '</div>' +
      '<div class="bar-track">' +
        '<div class="bar-fill-encoded" style="width:' + encodedPct + '%"></div>' +
        '<div class="bar-fill-unencoded" style="width:' + unencodedPct + '%"></div>' +
      '</div>' +
      '<div class="bar-count">' + encodedCount + '/' + d.count + '</div>' +
      '</div>';
  }
  el.innerHTML = html;
}

function renderMostApplied(s) {
  var el = document.getElementById('applied-list');
  var items = s.most_applied || [];
  if (items.length === 0) {
    el.innerHTML = '<div class="empty">No constraints applied yet</div>';
    return;
  }
  var limit = 8;
  var showAll = items.length <= limit;
  var visible = showAll ? items : items.slice(0, limit);
  var html = '';
  for (var i = 0; i < visible.length; i++) {
    var c = visible[i];
    html += renderConstraintDetail(c, '<span>Applied ' + c.times_applied + 'x</span>');
  }
  if (!showAll) {
    html += '<button class="show-more-btn" onclick="toggleAppliedList(this)" data-expanded="false">Show ' + (items.length - limit) + ' more</button>';
  }
  el.innerHTML = html;
  // Store full data for expand
  el._fullItems = items;
  el._limit = limit;
}

function toggleAppliedList(btn) {
  var el = document.getElementById('applied-list');
  var items = el._fullItems;
  var limit = el._limit;
  var expanded = btn.getAttribute('data-expanded') === 'true';
  var visible = expanded ? items.slice(0, limit) : items;
  var html = '';
  for (var i = 0; i < visible.length; i++) {
    var c = visible[i];
    html += renderConstraintDetail(c, '<span>Applied ' + c.times_applied + 'x</span>');
  }
  if (expanded) {
    html += '<button class="show-more-btn" onclick="toggleAppliedList(this)" data-expanded="false">Show ' + (items.length - limit) + ' more</button>';
  } else {
    html += '<button class="show-more-btn" onclick="toggleAppliedList(this)" data-expanded="true">Show less</button>';
  }
  el.innerHTML = html;
  el._fullItems = items;
  el._limit = limit;
}

function renderConstraintDetail(c, extraMeta) {
  var body = '';
  if (c.rule) body += '<div class="detail-field"><div class="detail-label">Rule</div><div>' + esc(c.rule) + '</div></div>';
  if (c.reasoning) body += '<div class="detail-field"><div class="detail-label">Reasoning</div><div>' + esc(c.reasoning) + '</div></div>';
  if (c.rejected_example) body += '<div class="detail-field"><div class="detail-label">Bad Example</div><div>' + esc(c.rejected_example) + '</div></div>';
  if (c.accepted_example) body += '<div class="detail-field"><div class="detail-label">Good Example</div><div>' + esc(c.accepted_example) + '</div></div>';
  body += '<div class="detail-field" style="font-family:var(--font-mono);font-size:11px">ID: ' + esc(c.id) + '</div>';
  var hasBody = c.rule || c.reasoning || c.rejected_example || c.accepted_example;
  if (hasBody) {
    return '<details class="clickable" onclick="if(!event.target.closest(\\'summary\\')){return}event.preventDefault();openConstraint(\\'' + esc(c.id) + '\\')">' +
      '<summary><div>' +
      '<div class="title">' + esc(c.title) + '</div>' +
      '<div class="meta">' + domainBadge(c.domain) + severityBadge(c.severity) + (extraMeta || '') + '</div>' +
      '</div></summary>' +
      '</details>';
  }
  return '<div class="list-item clickable" onclick="openConstraint(\\'' + esc(c.id) + '\\')">' +
    '<div class="title">' + esc(c.title) + '</div>' +
    '<div class="meta">' + domainBadge(c.domain) + severityBadge(c.severity) + (extraMeta || '') + '</div></div>';
}

function renderUnencoded(listResult) {
  var el = document.getElementById('unencoded-list');
  var items = listResult.rejections || [];
  if (items.length === 0) {
    el.innerHTML = '<div class="empty">All rejections are encoded \\u2014 nice work</div>';
    return;
  }
  var limit = 10;
  var visible = items.slice(0, limit);
  var html = '';
  for (var i = 0; i < visible.length; i++) {
    var r = visible[i];
    html += '<div class="list-item clickable" onclick="openRejection(\\'' + esc(r.id) + '\\')">' +
      '<div class="title">' + esc(r.description) + '</div>' +
      '<div class="meta">' + domainBadge(r.domain) + '<span>' + timeAgo(r.created_at) + '</span></div></div>';
  }
  if (listResult.total > limit) {
    var remaining = listResult.total - limit;
    html += '<button class="show-more-btn" onclick="toggleUnencodedList(this)" data-expanded="false">' + remaining + ' more unencoded rejections</button>';
  }
  el.innerHTML = html;
  el._allItems = items;
  el._total = listResult.total;
}

function toggleUnencodedList(btn) {
  var el = document.getElementById('unencoded-list');
  var items = el._allItems;
  var expanded = btn.getAttribute('data-expanded') === 'true';
  var visible = expanded ? items.slice(0, 10) : items;
  var html = '';
  for (var i = 0; i < visible.length; i++) {
    var r = visible[i];
    var body = '';
    html += '<div class="list-item clickable" onclick="openRejection(\\'' + esc(r.id) + '\\')">' +
      '<div class="title">' + esc(r.description) + '</div>' +
      '<div class="meta">' + domainBadge(r.domain) + '<span>' + timeAgo(r.created_at) + '</span></div></div>';
  }
  var remaining = el._total - (expanded ? 10 : items.length);
  if (expanded) {
    html += '<button class="show-more-btn" onclick="toggleUnencodedList(this)" data-expanded="false">' + (el._total - 10) + ' more unencoded rejections</button>';
  } else if (remaining > 0) {
    html += '<div class="empty">' + remaining + ' more not loaded</div>';
  }
  if (!expanded && items.length >= el._total) {
    html += '<button class="show-more-btn" onclick="toggleUnencodedList(this)" data-expanded="true">Show less</button>';
  }
  el.innerHTML = html;
  el._allItems = items;
}

function renderRecentlyEncoded(s) {
  var el = document.getElementById('recently-encoded-list');
  var items = s.recently_encoded || [];
  if (items.length === 0) {
    el.innerHTML = '<div class="empty">No encoded rejections yet</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var r = items[i];
    html += '<div class="list-item clickable" onclick="openRejection(\\'' + esc(r.id) + '\\')">' +
      '<div class="title">' + esc(r.description) + '</div>' +
      '<div class="meta">' + domainBadge(r.domain) +
      '<span>' + timeAgo(r.created_at) + '</span></div></div>';
  }
  el.innerHTML = html;
}

function renderPatterns(patternsData) {
  var section = document.getElementById('patterns-section');
  var el = document.getElementById('patterns-list');
  if (!patternsData || patternsData.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  var html = '';
  for (var i = 0; i < Math.min(patternsData.length, 5); i++) {
    var p = patternsData[i];
    html += '<div class="pattern-cluster">' +
      '<div class="pattern-header">' +
      domainBadge(p.domain) +
      '<span class="pattern-count">' + p.count + ' similar rejections</span>' +
      '</div>' +
      '<div class="pattern-theme">Keywords: ' + esc(p.theme) + '</div>' +
      '<div class="pattern-examples">';
    for (var j = 0; j < Math.min(p.descriptions.length, 3); j++) {
      html += '<div>' + esc(p.descriptions[j]) + '</div>';
    }
    if (p.descriptions.length > 3) {
      html += '<div style="color:var(--text-secondary);font-style:italic">+' + (p.descriptions.length - 3) + ' more</div>';
    }
    html += '</div></div>';
  }
  el.innerHTML = html;
}

function renderGraduation(s) {
  var section = document.getElementById('graduation-section');
  var el = document.getElementById('graduation-list');
  var items = s.graduation_candidates || [];
  if (items.length === 0) {
    section.style.display = 'none';
    updateGapsGraduationWrapper();
    return;
  }
  section.style.display = '';
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var c = items[i];
    html += '<div class="list-item clickable" onclick="openConstraint(\\'' + esc(c.id) + '\\')">' +
      '<div class="title">' + esc(c.title) + '</div>' +
      '<div class="graduation-rule">' + esc(c.rule) + '</div>' +
      '<div class="meta">' + domainBadge(c.domain) + severityBadge(c.severity) +
      '<span>Applied ' + c.times_applied + 'x</span></div></div>';
  }
  el.innerHTML = html;
  updateGapsGraduationWrapper();
}

function updateGapsGraduationWrapper() {
  var wrapper = document.getElementById('gaps-graduation-section');
  var gaps = document.getElementById('domain-gaps-section');
  var grad = document.getElementById('graduation-section');
  var gapsHidden = gaps.style.display === 'none';
  var gradHidden = grad.style.display === 'none';
  if (gapsHidden && gradHidden) {
    wrapper.style.display = 'none';
  } else {
    wrapper.style.display = '';
    wrapper.style.gridTemplateColumns = (gapsHidden || gradHidden) ? '1fr' : '1fr 1fr';
  }
}

function updateDeadElevationWrapper() {
  var wrapper = document.getElementById('dead-elevation-section');
  var dead = document.getElementById('dead-section');
  var deadHidden = dead.style.display === 'none';
  wrapper.style.gridTemplateColumns = deadHidden ? '1fr' : '1fr 1fr';
}

function renderDomainGaps(s) {
  var section = document.getElementById('domain-gaps-section');
  var el = document.getElementById('domain-gaps-list');
  var items = s.domain_gaps || [];
  if (items.length === 0) {
    section.style.display = 'none';
    updateGapsGraduationWrapper();
    return;
  }
  section.style.display = '';
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var d = items[i];
    // Bar width = % of unencoded (inverted coverage)
    var gapPct = 100 - d.coverage_pct;
    html += '<div class="domain-gap">' +
      '<div class="gap-domain">' + esc(d.domain) + '</div>' +
      '<div class="gap-bar"><div class="gap-bar-fill" style="width:' + gapPct + '%"></div></div>' +
      '<div class="gap-stats">' + d.unencoded + ' unencoded / ' + d.coverage_pct + '% covered</div>' +
      '</div>';
  }
  el.innerHTML = html;
  updateGapsGraduationWrapper();
}

function renderDead(s) {
  var section = document.getElementById('dead-section');
  var el = document.getElementById('dead-list');
  var items = s.dead_constraints || [];
  if (items.length === 0) {
    section.style.display = 'none';
    updateDeadElevationWrapper();
    return;
  }
  section.style.display = '';
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var c = items[i];
    html += renderConstraintDetail(c, '<span>Applied ' + c.times_applied + 'x · last ' + timeAgo(c.last_applied_at) + '</span>');
  }
  el.innerHTML = html;
  updateDeadElevationWrapper();
}

function renderElevation(s) {
  var el = document.getElementById('elevation-list');
  var items = s.elevation_candidates || [];
  if (items.length === 0) {
    el.innerHTML = '<div class="empty">No elevation candidates</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var c = items[i];
    html += renderConstraintDetail(c, '<span>Applied ' + c.times_applied + 'x</span>');
  }
  el.innerHTML = html;
}

// ── Page switching ──

var currentPage = 'overview';

function switchPage(page) {
  currentPage = page;
  document.getElementById('page-overview').style.display = page === 'overview' ? '' : 'none';
  document.getElementById('page-constraints').style.display = page === 'constraints' ? '' : 'none';
  var tabs = document.querySelectorAll('.nav-tab');
  for (var i = 0; i < tabs.length; i++) {
    var tabName = tabs[i].textContent.toLowerCase().trim();
    tabs[i].classList.toggle('active', tabName === page);
  }
  window.location.hash = page === 'overview' ? '' : page;
  if (page === 'constraints') loadConstraintsPage();
}

// ── Constraints page ──

var constraintSearchTimer = null;

function buildConstraintFilterParams() {
  var parts = [];
  var d = document.getElementById('cf-domain').value;
  var sv = document.getElementById('cf-severity').value;
  var st = document.getElementById('cf-status').value;
  var cat = document.getElementById('cf-category').value;
  var sort = document.getElementById('cf-sort').value;
  var q = document.getElementById('cf-search').value.trim();
  if (d) parts.push('domain=' + encodeURIComponent(d));
  if (sv) parts.push('severity=' + encodeURIComponent(sv));
  if (st) parts.push('status=' + encodeURIComponent(st));
  if (cat) parts.push('category=' + encodeURIComponent(cat));
  if (sort) parts.push('sort=' + encodeURIComponent(sort));
  if (q) parts.push('q=' + encodeURIComponent(q));
  return parts.length > 0 ? '?' + parts.join('&') : '';
}

function debounceConstraintSearch() {
  if (constraintSearchTimer) clearTimeout(constraintSearchTimer);
  constraintSearchTimer = setTimeout(applyConstraintFilters, 300);
}

function applyConstraintFilters() { loadConstraintsPage(); }

function clearConstraintFilters() {
  document.getElementById('cf-domain').value = '';
  document.getElementById('cf-severity').value = '';
  document.getElementById('cf-status').value = '';
  document.getElementById('cf-category').value = '';
  document.getElementById('cf-sort').value = 'newest';
  document.getElementById('cf-search').value = '';
  loadConstraintsPage();
}

function populateConstraintDropdowns(summary) {
  var domainEl = document.getElementById('cf-domain');
  var curDomain = domainEl.value;
  domainEl.innerHTML = '<option value="">All Domains</option>';
  var domains = summary.by_domain || [];
  for (var i = 0; i < domains.length; i++) {
    domainEl.innerHTML += '<option value="' + esc(domains[i].domain) + '">' + esc(domains[i].domain) + ' (' + domains[i].count + ')</option>';
  }
  domainEl.value = curDomain;

  var catEl = document.getElementById('cf-category');
  var curCat = catEl.value;
  catEl.innerHTML = '<option value="">All Categories</option>';
  var cats = summary.by_category || [];
  for (var j = 0; j < cats.length; j++) {
    catEl.innerHTML += '<option value="' + esc(cats[j].category) + '">' + esc(cats[j].category) + ' (' + cats[j].count + ')</option>';
  }
  catEl.value = curCat;
}

function renderConstraintsSummary(summary) {
  var el = document.getElementById('constraints-summary');
  var total = summary.total || 0;
  var statusMap = {};
  var byStatus = summary.by_status || [];
  for (var i = 0; i < byStatus.length; i++) statusMap[byStatus[i].status] = byStatus[i].count;
  var sevMap = {};
  var bySev = summary.by_severity || [];
  for (var j = 0; j < bySev.length; j++) sevMap[bySev[j].severity] = bySev[j].count;

  el.innerHTML =
    '<div class="stat-card"><div class="value">' + total + '</div><div class="label">Total</div></div>' +
    '<div class="stat-card good"><div class="value">' + (statusMap.active || 0) + '</div><div class="label">Active</div></div>' +
    '<div class="stat-card"><div class="value">' + (statusMap.deprecated || 0) + '</div><div class="label">Deprecated</div></div>' +
    '<div class="stat-card"><div class="value">' + (statusMap.superseded || 0) + '</div><div class="label">Superseded</div></div>' +
    '<div class="stat-card"><div class="value" style="color:var(--accent-red)">' + (sevMap.critical || 0) + '</div><div class="label">Critical</div></div>' +
    '<div class="stat-card"><div class="value" style="color:var(--accent-yellow)">' + (sevMap.important || 0) + '</div><div class="label">Important</div></div>' +
    '<div class="stat-card"><div class="value" style="color:var(--accent-purple)">' + (sevMap.preference || 0) + '</div><div class="label">Preference</div></div>';
}

function renderConstraintsList(constraints) {
  var countEl = document.getElementById('constraints-count');
  var el = document.getElementById('constraints-list');
  countEl.innerHTML = constraints.length + ' constraint' + (constraints.length !== 1 ? 's' : '');

  if (constraints.length === 0) {
    el.innerHTML = '<div class="empty">No constraints match the current filters</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < constraints.length; i++) {
    var c = constraints[i];
    var statusBadge = c.status !== 'active' ? '<span class="badge">' + esc(c.status) + '</span>' : '';
    var linkedCount = c.linked_rejection_count || 0;
    var appliedText = c.times_applied > 0 ? 'Applied ' + c.times_applied + 'x' : 'Never applied';
    var staleIndicator = '';
    if (c.status === 'active' && c.times_applied === 0) {
      var ageMs = Date.now() - new Date(c.created_at).getTime();
      if (ageMs > 7 * 86400000) staleIndicator = ' \\u00B7 <span style="color:var(--accent-yellow)" title="Never applied, older than 7 days">stale</span>';
    }

    // Parse tags
    var tagsHtml = '';
    try {
      var tags = c.tags ? JSON.parse(c.tags) : null;
      if (tags && tags.length > 0) {
        for (var t = 0; t < tags.length; t++) tagsHtml += '<span class="tag">' + esc(tags[t]) + '</span>';
      }
    } catch(e) {}

    html += '<div class="constraint-card" onclick="openConstraint(\\'' + esc(c.id) + '\\')">';
    html += '<div class="constraint-title">' + esc(c.title) + '</div>';
    html += '<div class="constraint-rule">' + esc(c.rule) + '</div>';
    html += '<div class="constraint-meta">';
    html += domainBadge(c.domain) + severityBadge(c.severity) + '<span class="badge">' + esc(c.category) + '</span>' + statusBadge;
    if (tagsHtml) html += tagsHtml;
    html += '</div>';
    html += '<div class="constraint-stats">';
    html += appliedText + ' \\u00B7 ' + linkedCount + ' rejection' + (linkedCount !== 1 ? 's' : '') + ' \\u00B7 ' + timeAgo(c.created_at) + staleIndicator;
    html += '</div>';
    html += '</div>';
  }
  el.innerHTML = html;
}

async function loadConstraintsPage() {
  var params = buildConstraintFilterParams();
  try {
    var results = await Promise.all([
      fetchJson('/api/constraints/all' + params),
      fetchJson('/api/constraints/summary')
    ]);
    populateConstraintDropdowns(results[1]);
    renderConstraintsSummary(results[1]);
    renderConstraintsList(results[0]);
  } catch(err) {
    document.getElementById('constraints-list').innerHTML = '<div class="empty">Error: ' + esc(err.message) + '</div>';
  }
}

// ── Refresh ──

async function refresh() {
  var statusEl = document.getElementById('status');
  statusEl.textContent = 'Refreshing...';
  try {
    if (currentPage === 'overview') {
      var results = await Promise.all([
        fetchJson('/api/stats'),
        fetchJson('/api/list?status=unencoded&limit=30'),
        fetchJson('/api/patterns')
      ]);
      var stats = results[0];
      var listResult = results[1];
      var patternsData = results[2];
      renderStatsCards(stats);
      renderDomainBars(stats);
      renderMostApplied(stats);
      renderPatterns(patternsData);
      renderUnencoded(listResult);
      renderRecentlyEncoded(stats);
      renderDomainGaps(stats);
      renderGraduation(stats);
      renderDead(stats);
      renderElevation(stats);
    } else if (currentPage === 'constraints') {
      await loadConstraintsPage();
    }
    statusEl.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    statusEl.textContent = 'Error: ' + err.message;
  }
}

function toggleAuto() {
  autoRefresh = !autoRefresh;
  var btn = document.getElementById('auto-btn');
  if (autoRefresh) {
    btn.textContent = 'Auto: ON';
    btn.classList.add('active');
    startAutoRefresh();
  } else {
    btn.textContent = 'Auto: OFF';
    btn.classList.remove('active');
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  }
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(refresh, 10000);
}

// Hash routing
if (window.location.hash === '#constraints') {
  switchPage('constraints');
} else {
  refresh();
}
startAutoRefresh();
`;
