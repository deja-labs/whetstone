// Dashboard HTML assembly.
// Produces a single HTML string with Tailwind v4 + Lit Web Components.
// No build step — everything loaded from CDN.

import { THEME, COMPAT_VARS, CUSTOM_CSS } from "./theme.js";
import { BASE_COMPONENT } from "./components/base.js";
import { STAT_CARD } from "./components/stat-card.js";
import { BADGE } from "./components/badge.js";
import { NAV } from "./components/nav.js";
import { OVERVIEW } from "./components/overview.js";
import { CONSTRAINTS } from "./components/constraints.js";
import { REJECTIONS } from "./components/rejections.js";
import { APP } from "./components/app.js";

const LIT_CDN = "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
const TAILWIND_CDN = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";

const COMPONENT_SCRIPT = `<script type="module">
import { LitElement, html, css } from '${LIT_CDN}';

${BASE_COMPONENT}
${STAT_CARD}
${BADGE}
${NAV}
${OVERVIEW}
${CONSTRAINTS}
${REJECTIONS}
${APP}
</script>`;

export function getDashboardHtml(version: string): string {
  const footer =
    '\n<footer class="py-6 px-8 border-t border-edge-subtle text-center text-xs text-muted font-mono leading-relaxed">' +
    '<div>Whetstone MCP v' + version + ' · MIT License</div>' +
    '<div><a class="text-accent no-underline hover:underline transition-colors" href="https://github.com/frontier-collective/whetstone-mcp">GitHub</a> · ' +
    '<a class="text-accent no-underline hover:underline transition-colors" href="https://www.npmjs.com/package/@frontier-collective/whetstone-mcp">npm</a> · ' +
    'Built by <a class="text-accent no-underline hover:underline transition-colors" href="https://github.com/frontier-collective">Frontier Collective</a></div>' +
    '</footer>\n';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Whetstone Dashboard</title>
<script src="${TAILWIND_CDN}"></script>
<style type="text/tailwindcss">
${THEME}
${COMPAT_VARS}
${CUSTOM_CSS}
</style>
${COMPONENT_SCRIPT}
</head>
<body class="bg-surface text-primary font-sans min-h-screen flex flex-col">
<main class="flex-1 px-8 py-8 max-w-[1600px] mx-auto w-full">
${BODY}
</main>
${footer}
<script>
${SCRIPT}
</script>
</body>
</html>`;
}

// ── Body ──────────────────────────────────────────────────────────────

const BODY = `
<whet-app></whet-app>

<template id="app-template">
<whet-nav current-page="overview" status="Loading..." auto-refresh></whet-nav>

<whet-overview id="page-overview" class="page"></whet-overview>
<whet-rejections id="page-rejections" class="page" style="display:none"></whet-rejections>
<whet-constraints id="page-constraints" class="page" style="display:none"></whet-constraints>

<div id="modal-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-8" style="display:none" onclick="if(event.target===this)closeModal()">
  <div class="bg-card border border-edge rounded-xl w-full max-w-[720px] max-h-[calc(100vh-64px)] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_1px_rgba(255,255,255,0.05)]" id="modal-content"></div>
</div>
</template>
`;

// ── Script (shared utilities + modal functions) ──────────────────────

const SCRIPT = `
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
  return '<whet-badge text="' + esc(sev) + '" variant="' + esc(sev) + '"></whet-badge>';
}

function domainBadge(domain) {
  return '<whet-badge text="' + esc(domain) + '"></whet-badge>';
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
    val = '<div class="wh-field-value empty">\\u2014</div>';
  } else if (opts.code) {
    val = '<div class="wh-field-value"><code>' + esc(value) + '</code></div>';
  } else if (opts.html) {
    val = '<div class="wh-field-value' + cls + '">' + value + '</div>';
  } else {
    val = '<div class="wh-field-value' + cls + '">' + esc(value) + '</div>';
  }
  return '<div class="wh-modal-field"><div class="wh-field-label">' + esc(label) + '</div>' + val + '</div>';
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
  content.innerHTML = '<div class="p-6"><div class="wh-empty">Loading...</div></div>';
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  try {
    var r = await fetchJson('/api/rejection/' + encodeURIComponent(id));
    var html = '<div class="flex items-start justify-between p-6 pb-5 border-b border-edge sticky top-0 bg-card/95 backdrop-blur-md rounded-t-xl z-10">';
    html += '<div><div class="text-[11px] font-mono text-muted uppercase tracking-widest mb-2">Rejection</div>';
    html += '<h2 class="text-base font-semibold text-primary leading-snug">' + esc(r.description) + '</h2></div>';
    html += '<button class="bg-transparent border-none text-muted text-xl cursor-pointer ml-4 leading-none shrink-0 hover:text-primary w-8 h-8 rounded-md flex items-center justify-center hover:bg-raised transition-colors" onclick="closeModal()">\\u00D7</button></div>';
    html += '<div class="p-6">';
    html += '<div class="flex gap-2 flex-wrap mb-5">' + domainBadge(r.domain) + '</div>';
    html += modalField('Description', r.description);
    html += modalField('Reasoning', r.reasoning, { showEmpty: true });
    html += modalField('Raw Output', r.raw_output, { code: true, showEmpty: true });
    if (r.constraint_id) {
      html += '<div class="wh-modal-field"><div class="wh-field-label">Encoded By</div><div class="wh-field-value flex items-center gap-3"><a href="#" onclick="event.preventDefault();openConstraint(\\'' + esc(r.constraint_id) + '\\')" class="text-accent no-underline font-mono text-xs">' + esc(r.constraint_id) + ' \\u2192 View constraint</a><button onclick="unlinkRejection(\\'' + esc(r.id) + '\\')" class="text-red border border-red/30 bg-glow-red rounded-md text-[11px] px-2 py-0.5 cursor-pointer hover:bg-red hover:text-surface transition-colors">Unlink</button></div></div>';
    } else {
      html += modalField('Encoded By', 'Not yet encoded', { showEmpty: true });
    }
    html += '<hr class="border-none border-t border-edge-subtle my-6">';
    html += modalField('ID', r.id, { mono: true });
    html += modalField('Created', formatDate(r.created_at), { mono: true });
    html += '</div>';
    content.innerHTML = html;
  } catch(err) {
    content.innerHTML = '<div class="p-6"><div class="wh-empty">Error: ' + esc(err.message) + '</div></div>';
  }
}

async function openConstraint(id) {
  var overlay = document.getElementById('modal-overlay');
  var content = document.getElementById('modal-content');
  content.innerHTML = '<div class="p-6"><div class="wh-empty">Loading...</div></div>';
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  try {
    var c = await fetchJson('/api/constraint/' + encodeURIComponent(id));
    var html = '<div class="flex items-start justify-between p-6 pb-5 border-b border-edge sticky top-0 bg-card/95 backdrop-blur-md rounded-t-xl z-10">';
    html += '<div><div class="text-[11px] font-mono text-muted uppercase tracking-widest mb-2">Constraint</div>';
    html += '<h2 class="text-base font-semibold text-primary leading-snug">' + esc(c.title) + '</h2></div>';
    html += '<button class="bg-transparent border-none text-muted text-xl cursor-pointer ml-4 leading-none shrink-0 hover:text-primary w-8 h-8 rounded-md flex items-center justify-center hover:bg-raised transition-colors" onclick="closeModal()">\\u00D7</button></div>';
    html += '<div class="p-6">';
    html += '<div class="flex gap-2 flex-wrap mb-5">' + domainBadge(c.domain) + severityBadge(c.severity) + '<whet-badge text="' + esc(c.category) + '"></whet-badge><whet-badge text="' + esc(c.status) + '"></whet-badge></div>';
    html += modalField('Rule', c.rule);
    html += modalField('Reasoning', c.reasoning, { showEmpty: true });
    html += modalField('Bad Example', c.rejected_example, { code: true, showEmpty: true });
    html += modalField('Good Example', c.accepted_example, { code: true, showEmpty: true });
    // Tags
    var tags = null;
    try { tags = c.tags ? JSON.parse(c.tags) : null; } catch(e) { tags = c.tags ? [c.tags] : null; }
    if (tags && tags.length > 0) {
      var tagsHtml = '<div class="flex gap-2 flex-wrap">';
      for (var t = 0; t < tags.length; t++) tagsHtml += '<span class="wh-tag">' + esc(tags[t]) + '</span>';
      tagsHtml += '</div>';
      html += '<div class="wh-modal-field"><div class="wh-field-label">Tags</div>' + tagsHtml + '</div>';
    } else {
      html += modalField('Tags', null, { showEmpty: true });
    }
    html += modalField('Source', c.source, { showEmpty: true });
    html += '<hr class="border-none border-t border-edge-subtle my-6">';
    html += modalField('Times Applied', String(c.times_applied || 0), { mono: true });
    html += modalField('Last Applied', c.last_applied_at ? formatDate(c.last_applied_at) : null, { mono: true, showEmpty: true });
    html += modalField('ID', c.id, { mono: true });
    html += modalField('Created', formatDate(c.created_at), { mono: true });
    html += modalField('Updated', formatDate(c.updated_at), { mono: true });
    // Linked rejections
    var linked = c.linked_rejections || [];
    html += '<hr class="border-none border-t border-edge-subtle my-6">';
    html += '<div class="wh-modal-field"><div class="wh-field-label">Linked Rejections (' + linked.length + ')</div>';
    if (linked.length > 0) {
      html += '<div class="mt-3">';
      for (var i = 0; i < linked.length; i++) {
        var lr = linked[i];
        html += '<div class="py-3 px-4 bg-raised rounded-md mb-2.5 cursor-pointer border border-edge-subtle hover:border-accent hover:bg-card transition-all duration-150" onclick="openRejection(\\'' + esc(lr.id) + '\\')">';
        html += '<div class="flex justify-between items-start gap-3">';
        html += '<div><div class="text-[13px] text-primary">' + esc(lr.description) + '</div>';
        html += '<div class="text-[11px] text-muted mt-1">' + esc(lr.domain) + ' \\u00B7 ' + timeAgo(lr.created_at) + '</div></div>';
        html += '<button onclick="event.stopPropagation();unlinkFromConstraint(\\'' + esc(lr.id) + '\\',\\'' + esc(c.id) + '\\')" class="text-red border border-red/30 bg-glow-red rounded-md text-[10px] px-1.5 py-0.5 cursor-pointer shrink-0 hover:bg-red hover:text-surface transition-colors">Unlink</button>';
        html += '</div></div>';
      }
      html += '</div>';
    } else {
      html += '<div class="wh-field-value empty">\\u2014</div>';
    }
    html += '</div>';
    if (linked.length === 0) {
      html += '<div class="text-center py-4">';
      html += '<button onclick="deleteConstraint(\\'' + esc(c.id) + '\\')" class="text-red border border-red/30 bg-glow-red rounded-md text-[13px] py-2.5 px-5 cursor-pointer hover:bg-red hover:text-surface transition-colors font-medium">Delete Constraint</button>';
      html += '<div class="text-[11px] text-muted mt-2">No linked rejections \\u2014 safe to delete</div>';
      html += '</div>';
    }
    html += '</div>';
    content.innerHTML = html;
  } catch(err) {
    content.innerHTML = '<div class="p-6"><div class="wh-empty">Error: ' + esc(err.message) + '</div></div>';
  }
}

function deltaText(n, label) {
  if (!n) return '';
  var sign = n > 0 ? '+' : '';
  return sign + n + ' ' + label;
}

// ── Shared render helper (used by overview component) ──

function renderConstraintDetail(c, extraMeta) {
  var hasBody = c.rule || c.reasoning || c.rejected_example || c.accepted_example;
  if (hasBody) {
    return '<details class="clickable py-3.5 border-b border-edge text-sm" onclick="if(!event.target.closest(\\'summary\\')){return}event.preventDefault();openConstraint(\\'' + esc(c.id) + '\\')">' +
      '<summary class="cursor-pointer flex items-start gap-2"><div>' +
      '<div class="title text-primary font-medium">' + esc(c.title) + '</div>' +
      '<div class="meta flex gap-2 items-center flex-wrap text-xs text-muted mt-2">' + domainBadge(c.domain) + severityBadge(c.severity) + (extraMeta || '') + '</div>' +
      '</div></summary>' +
      '</details>';
  }
  return '<div class="wh-list-item clickable" onclick="openConstraint(\\'' + esc(c.id) + '\\')">' +
    '<div class="title text-primary font-medium">' + esc(c.title) + '</div>' +
    '<div class="meta flex gap-2 items-center flex-wrap text-xs text-muted mt-2">' + domainBadge(c.domain) + severityBadge(c.severity) + (extraMeta || '') + '</div></div>';
}
`;
