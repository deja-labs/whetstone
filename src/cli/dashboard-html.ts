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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
}

.bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 4px;
  transition: width 0.4s ease;
  min-width: 2px;
}

.bar-count {
  width: 40px;
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

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
  gap: 12px;
}

.badge {
  display: inline-block;
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 2px 6px;
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

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .two-col { grid-template-columns: 1fr; }
}
`;

// ── Body ──────────────────────────────────────────────────────────────

const BODY = `
<header>
  <h1>Whetstone <span>Dashboard</span></h1>
  <div class="header-controls">
    <span id="status">Loading...</span>
    <button onclick="refresh()">Refresh</button>
    <button id="auto-btn" class="active" onclick="toggleAuto()">Auto: ON</button>
  </div>
</header>

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

<div class="card">
  <h2>Unencoded Rejections</h2>
  <div id="unencoded-list"></div>
</div>

<section class="two-col">
  <div class="card">
    <h2>Stale Constraints</h2>
    <div id="stale-list"></div>
  </div>
  <div class="card">
    <h2>Elevation Candidates</h2>
    <div id="elevation-list"></div>
  </div>
</section>
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

function renderStatsCards(s) {
  var el = document.getElementById('stats-cards');
  var unencodedClass = s.unencoded_rejections > 0 ? ' warn' : '';
  el.innerHTML =
    '<div class="stat-card"><div class="value">' + s.total_rejections + '</div><div class="label">Rejections</div></div>' +
    '<div class="stat-card"><div class="value">' + s.total_constraints + '</div><div class="label">Constraints</div></div>' +
    '<div class="stat-card good"><div class="value">' + s.active_constraints + '</div><div class="label">Active</div></div>' +
    '<div class="stat-card' + unencodedClass + '"><div class="value">' + s.unencoded_rejections + '</div><div class="label">Unencoded</div></div>';
}

function renderDomainBars(s) {
  var el = document.getElementById('domain-bars');
  var domains = s.rejections_by_domain || [];
  if (domains.length === 0) {
    el.innerHTML = '<div class="empty">No rejections yet</div>';
    return;
  }
  var max = Math.max.apply(null, domains.map(function(d) { return d.count; }));
  var html = '';
  for (var i = 0; i < domains.length; i++) {
    var d = domains[i];
    var pct = max > 0 ? Math.round((d.count / max) * 100) : 0;
    html += '<div class="bar-row">' +
      '<div class="bar-label">' + esc(d.domain) + '</div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="bar-count">' + d.count + '</div>' +
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
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var c = items[i];
    html += '<div class="list-item">' +
      '<div class="title">' + esc(c.title) + '</div>' +
      '<div class="meta">' + domainBadge(c.domain) +
      '<span>Applied ' + c.times_applied + 'x</span></div></div>';
  }
  el.innerHTML = html;
}

function renderUnencoded(listResult) {
  var el = document.getElementById('unencoded-list');
  var items = listResult.rejections || [];
  if (items.length === 0) {
    el.innerHTML = '<div class="empty">All rejections are encoded \\u2014 nice work</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var r = items[i];
    var body = '';
    if (r.reasoning) body += '<div><strong>Why:</strong> ' + esc(r.reasoning) + '</div>';
    if (r.raw_output) body += '<div style="margin-top:8px"><strong>Output:</strong> ' + esc(r.raw_output.substring(0, 300)) + (r.raw_output.length > 300 ? '...' : '') + '</div>';
    body += '<div style="margin-top:8px;font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)">ID: ' + esc(r.id) + '</div>';
    html += '<details>' +
      '<summary><div>' +
      '<div class="title">' + esc(r.description) + '</div>' +
      '<div class="meta">' + domainBadge(r.domain) + '<span>' + timeAgo(r.created_at) + '</span></div>' +
      '</div></summary>' +
      '<div class="detail-body">' + body + '</div>' +
      '</details>';
  }
  if (listResult.total > items.length) {
    html += '<div class="empty">' + (listResult.total - items.length) + ' more not shown</div>';
  }
  el.innerHTML = html;
}

function renderStale(s) {
  var el = document.getElementById('stale-list');
  var items = s.stale_constraints || [];
  if (items.length === 0) {
    el.innerHTML = '<div class="empty">No stale constraints</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var c = items[i];
    html += '<div class="list-item">' +
      '<div class="title">' + esc(c.title) + '</div>' +
      '<div class="meta">' + domainBadge(c.domain) + severityBadge(c.severity) +
      '<span>' + timeAgo(c.created_at) + '</span></div></div>';
  }
  el.innerHTML = html;
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
    html += '<div class="list-item">' +
      '<div class="title">' + esc(c.title) + '</div>' +
      '<div class="meta">' + domainBadge(c.domain) + severityBadge(c.severity) +
      '<span>Applied ' + c.times_applied + 'x</span></div></div>';
  }
  el.innerHTML = html;
}

async function refresh() {
  var statusEl = document.getElementById('status');
  statusEl.textContent = 'Refreshing...';
  try {
    var results = await Promise.all([
      fetchJson('/api/stats'),
      fetchJson('/api/list?status=unencoded&limit=30')
    ]);
    var stats = results[0];
    var listResult = results[1];
    renderStatsCards(stats);
    renderDomainBars(stats);
    renderMostApplied(stats);
    renderUnencoded(listResult);
    renderStale(stats);
    renderElevation(stats);
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

refresh();
startAutoRefresh();
`;
