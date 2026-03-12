// Dashboard HTML assembly.
// Produces a single HTML string with Tailwind v4 + Lit Web Components.
// No build step — everything loaded from CDN.

import { THEME, COMPAT_VARS, CUSTOM_CSS, CHOICES_CSS } from "./theme.js";
import { BASE_COMPONENT } from "./components/base.js";
import { NAV } from "./components/nav.js";
import { OVERVIEW } from "./components/overview.js";
import { CONSTRAINTS } from "./components/constraints.js";
import { REJECTIONS } from "./components/rejections.js";
import { APP } from "./components/app.js";
import { FAVICON_ICO_B64, APPLE_TOUCH_ICON_B64 } from "./favicon.js";

const LIT_CDN = "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
const TAILWIND_CDN = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";
const CHOICES_JS_CDN = "https://cdn.jsdelivr.net/npm/choices.js@11/public/assets/scripts/choices.min.js";
const CHOICES_CSS_CDN = "https://cdn.jsdelivr.net/npm/choices.js@11/public/assets/styles/choices.min.css";

const COMPONENT_SCRIPT = `<script type="module">
import { LitElement, html, css } from '${LIT_CDN}';

${BASE_COMPONENT}
${NAV}
${OVERVIEW}
${CONSTRAINTS}
${REJECTIONS}
${APP}
</script>`;

export function getDashboardHtml(version: string): string {
  const footer =
    '\n<footer class="wh-container py-6 border-t border-edge-subtle text-center text-xs text-muted font-mono leading-relaxed">' +
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
<link rel="icon" type="image/x-icon" href="data:image/x-icon;base64,${FAVICON_ICO_B64}">
<link rel="apple-touch-icon" sizes="180x180" href="data:image/png;base64,${APPLE_TOUCH_ICON_B64}">
<script src="${TAILWIND_CDN}"></script>
<link rel="stylesheet" href="${CHOICES_CSS_CDN}">
<script src="${CHOICES_JS_CDN}"></script>
<style type="text/tailwindcss">
${THEME}
${COMPAT_VARS}
${CUSTOM_CSS}
</style>
<style>${CHOICES_CSS}</style>
${COMPONENT_SCRIPT}
</head>
<body class="bg-surface text-primary font-sans min-h-screen flex flex-col">
<main class="flex-1 wh-container pb-6 md:pb-10">
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
<whet-nav current-page="overview" status="Loading..."></whet-nav>

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
  return '<span class="wh-badge wh-badge-' + esc(sev) + '">' + esc(sev) + '</span>';
}

function domainBadge(domain) {
  return '<span class="wh-badge">' + esc(domain) + '</span>';
}

function renderStat(value, label, opts) {
  opts = opts || {};
  var valClass = 'wh-stat-value';
  if (opts.good) valClass += ' good';
  if (opts.warn) valClass += ' warn';
  var style = opts.color ? ' style="color:' + opts.color + '"' : '';
  var clickable = opts.href ? ' wh-stat-clickable' : '';
  var onclick = '';
  var dataAttrs = '';
  if (opts.href && opts.href.toggle) {
    var toggleFn = opts.href.page === 'rejections' ? 'toggleRejectionFilter' : 'toggleConstraintFilter';
    onclick = ' onclick="' + toggleFn + '(\\'' + opts.href.toggle.field + '\\', \\'' + opts.href.toggle.value + '\\')"';
    dataAttrs = ' data-toggle-field="' + opts.href.toggle.field + '" data-toggle-value="' + opts.href.toggle.value + '"';
  } else if (opts.href) {
    onclick = ' onclick="navigateWithFilters(\\'' + opts.href.page + '\\', ' + JSON.stringify(opts.href.filters || {}).replace(/"/g, "'") + ')"';
  }
  var h = '<div class="wh-stat' + clickable + '"' + onclick + dataAttrs + '>';
  h += '<div class="' + valClass + '"' + style + '>' + esc(String(value)) + '</div>';
  h += '<div class="wh-stat-label">' + esc(label) + '</div>';
  if (opts.delta) {
    var n = parseFloat(opts.delta);
    var deltaClass = 'wh-stat-delta';
    if (n > 0) deltaClass += ' text-green';
    else if (n < 0) deltaClass += ' text-red';
    else deltaClass += ' text-muted';
    h += '<div class="' + deltaClass + '">' + esc(opts.delta) + '</div>';
  }
  h += '</div>';
  return h;
}

function setFilterValue(elId, value) {
  var el = document.getElementById(elId);
  if (!el) return;
  if (el._choices) {
    el._choices.setChoiceByValue(value);
  } else {
    el.value = value;
  }
}

function navigateWithFilters(page, filters) {
  var app = document.querySelector('whet-app');
  app.switchPage(page);
  filters = filters || {};
  setTimeout(function() {
    if (page === 'rejections') {
      if (filters.encoded) setFilterValue('rf-encoded', filters.encoded);
      if (filters.domain) setFilterValue('rf-domain', filters.domain);
      if (typeof applyRejectionFilters === 'function') applyRejectionFilters();
    } else if (page === 'constraints') {
      if (filters.status) setFilterValue('cf-status', filters.status);
      if (filters.severity) setFilterValue('cf-severity', filters.severity);
      if (filters.domain) setFilterValue('cf-domain', filters.domain);
      if (typeof applyConstraintFilters === 'function') applyConstraintFilters();
    }
  }, 100);
}

function toggleConstraintFilter(field, value) {
  var elId = field === 'status' ? 'cf-status' : field === 'severity' ? 'cf-severity' : null;
  if (!elId) return;
  var el = document.getElementById(elId);
  if (!el) return;
  var newVal = (el.value === value) ? '' : value;
  setFilterValue(elId, newVal);
  if (typeof applyConstraintFilters === 'function') applyConstraintFilters();
}

function toggleRejectionFilter(field, value) {
  var elId = field === 'encoded' ? 'rf-encoded' : field === 'domain' ? 'rf-domain' : null;
  if (!elId) return;
  var el = document.getElementById(elId);
  if (!el) return;
  var newVal = (el.value === value) ? '' : value;
  setFilterValue(elId, newVal);
  if (typeof applyRejectionFilters === 'function') applyRejectionFilters();
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

var FIELD_OPTIONS = {
  severity: ['critical', 'important', 'preference'],
  status: ['active', 'superseded', 'deprecated'],
  category: ['code-quality', 'pattern', 'business-logic', 'framing', 'reasoning', 'editorial']
};

function editableField(entityId, fieldName, label, value, opts) {
  opts = opts || {};
  var entity = opts.entity || 'rejection';
  var displayVal;
  if (!value) {
    displayVal = '<span class="empty">\\u2014</span>';
  } else if (fieldName === 'domain') {
    displayVal = domainBadge(value);
  } else if (fieldName === 'severity') {
    displayVal = severityBadge(value);
  } else if (fieldName === 'status' || fieldName === 'category') {
    displayVal = '<span class="wh-badge">' + esc(value) + '</span>';
  } else if (fieldName === 'tags') {
    var tagArr = value ? value.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
    if (tagArr.length > 0) {
      displayVal = '<div class="wh-flex-wrap">';
      for (var ti = 0; ti < tagArr.length; ti++) displayVal += '<span class="wh-tag">' + esc(tagArr[ti]) + '</span>';
      displayVal += '</div>';
    } else {
      displayVal = '<span class="empty">\\u2014</span>';
    }
  } else if (opts.code) {
    displayVal = '<code>' + esc(value) + '</code>';
  } else {
    displayVal = esc(value);
  }
  var dataVal = value ? value.replace(/&/g,'&amp;').replace(/"/g,'&quot;') : '';
  var tag = (opts.code || fieldName === 'reasoning') ? 'textarea' : 'input';
  var codeAttr = opts.code ? ' data-code="true"' : '';
  return '<div class="wh-modal-field">' +
    '<div class="wh-field-label">' + esc(label) + '</div>' +
    '<div class="wh-field-value wh-field-editable" data-field="' + fieldName + '" data-id="' + entityId + '" data-entity="' + entity + '" data-tag="' + tag + '"' + codeAttr + ' data-value="' + dataVal + '" onclick="startEdit(this)">' +
    displayVal + '</div></div>';
}

function startEdit(el) {
  if (el.querySelector('input, textarea, select')) return;
  var field = el.dataset.field;
  var id = el.dataset.id;
  var tag = el.dataset.tag;
  var value = el.dataset.value;

  if (field === 'domain') { startDomainEdit(el, id, value); return; }
  if (field === 'tags') { startTagsEdit(el, id, value); return; }
  if (FIELD_OPTIONS[field]) { startSelectEdit(el, id, field, value, FIELD_OPTIONS[field]); return; }

  var input;
  if (tag === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 4;
  } else {
    input = document.createElement('input');
    input.type = 'text';
  }
  input.className = 'wh-inline-edit' + (el.dataset.code ? ' wh-inline-edit-code' : '');
  input.value = value;
  el.textContent = '';
  el.appendChild(input);
  input.focus();
  if (tag !== 'textarea') input.select();
  input.addEventListener('blur', function() { saveField(el, id, field, input.value); });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { e.preventDefault(); renderFieldValue(el, value); }
    if (e.key === 'Enter' && tag !== 'textarea') { e.preventDefault(); input.blur(); }
  });
}

function startSelectEdit(el, entityId, field, currentValue, options) {
  var wrapper = document.createElement('div');
  wrapper.className = 'wh-domain-edit-wrapper';
  var select = document.createElement('select');
  select.className = 'wh-inline-edit';
  for (var i = 0; i < options.length; i++) {
    var opt = document.createElement('option');
    opt.value = options[i];
    opt.textContent = options[i];
    if (options[i] === currentValue) opt.selected = true;
    select.appendChild(opt);
  }
  el.textContent = '';
  wrapper.appendChild(select);
  el.appendChild(wrapper);

  var choices = new Choices(select, {
    searchEnabled: false,
    shouldSort: false,
    itemSelectText: '',
  });
  el._choices = choices;

  select.addEventListener('change', function() {
    var newVal = select.value;
    choices.destroy();
    el._choices = null;
    if (newVal && newVal !== currentValue) {
      saveField(el, entityId, field, newVal);
    } else {
      renderFieldValue(el, currentValue);
    }
  });

  select.addEventListener('hideDropdown', function() {
    setTimeout(function() {
      if (el._choices && !el.querySelector('.choices.is-open')) {
        el._choices.destroy();
        el._choices = null;
        renderFieldValue(el, currentValue);
      }
    }, 200);
  });

  choices.showDropdown();
}

async function startDomainEdit(el, entityId, currentValue) {
  var wrapper = document.createElement('div');
  wrapper.className = 'wh-domain-edit-wrapper';
  var select = document.createElement('select');
  select.className = 'wh-inline-edit';

  // Fetch existing domains from both rejections and constraints
  try {
    var results = await Promise.all([
      fetchJson('/api/rejections/summary'),
      fetchJson('/api/constraints/summary')
    ]);
    var domainSet = {};
    var rDomains = (results[0].by_domain || []);
    var cDomains = (results[1].by_domain || []);
    for (var i = 0; i < rDomains.length; i++) domainSet[rDomains[i].domain] = true;
    for (var i = 0; i < cDomains.length; i++) domainSet[cDomains[i].domain] = true;
    var domains = Object.keys(domainSet).sort();
    if (currentValue && !domainSet[currentValue]) {
      domains.unshift(currentValue);
    }
    for (var i = 0; i < domains.length; i++) {
      var opt = document.createElement('option');
      opt.value = domains[i];
      opt.textContent = domains[i];
      if (domains[i] === currentValue) opt.selected = true;
      select.appendChild(opt);
    }
  } catch(e) {
    var opt = document.createElement('option');
    opt.value = currentValue;
    opt.textContent = currentValue;
    opt.selected = true;
    select.appendChild(opt);
  }

  el.textContent = '';
  wrapper.appendChild(select);
  el.appendChild(wrapper);

  var choices = new Choices(select, {
    searchEnabled: true,
    shouldSort: false,
    itemSelectText: '',
    searchPlaceholderValue: 'Type to search or add...',
    duplicateItemsAllowed: false,
  });
  el._choices = choices;

  // Dynamically add the typed value as a selectable choice so clicking works.
  // On each keystroke, rebuild the full choice list = base domains + optional custom entry.
  // This avoids stale "Add" entries accumulating from previous keystrokes.
  var _baseDomains = (domains || []).slice();
  var _domainLookup = domainSet || {};
  select.addEventListener('search', function(evt) {
    var typed = (evt.detail && evt.detail.value || '').trim();
    var rebuilt = [];
    if (typed && !_domainLookup[typed]) {
      rebuilt.push({ value: typed, label: 'Add "' + typed + '"' });
    }
    for (var i = 0; i < _baseDomains.length; i++) {
      rebuilt.push({ value: _baseDomains[i], label: _baseDomains[i] });
    }
    choices.clearChoices();
    choices.setChoices(rebuilt, 'value', 'label', false);
  });

  select.addEventListener('change', function() {
    var newVal = select.value;
    choices.destroy();
    el._choices = null;
    if (newVal && newVal !== currentValue) {
      saveField(el, entityId, 'domain', newVal);
    } else {
      renderFieldValue(el, currentValue);
    }
  });

  select.addEventListener('hideDropdown', function() {
    setTimeout(function() {
      if (el._choices && !el.querySelector('.choices.is-open')) {
        el._choices.destroy();
        el._choices = null;
        renderFieldValue(el, currentValue);
      }
    }, 200);
  });

  choices.showDropdown();
}

function cleanTag(s) {
  return s.replace(/[^a-zA-Z0-9\\- ]/g, '').trim().toLowerCase();
}

function startTagsEdit(el, entityId, currentValue) {
  var currentTags = currentValue ? currentValue.split(',').map(function(t) { return cleanTag(t); }).filter(Boolean) : [];
  // Deduplicate initial tags
  var seen = {};
  currentTags = currentTags.filter(function(t) { if (seen[t]) return false; seen[t] = true; return true; });

  var container = document.createElement('div');
  container.className = 'wh-tag-input';
  el.textContent = '';
  el.appendChild(container);

  var tags = currentTags.slice();

  function renderTags() {
    // Remove existing pills but keep the input
    var pills = container.querySelectorAll('.wh-tag-pill');
    for (var i = 0; i < pills.length; i++) pills[i].remove();
    var inp = container.querySelector('.wh-tag-text');
    for (var i = 0; i < tags.length; i++) {
      var pill = document.createElement('span');
      pill.className = 'wh-tag-pill';
      pill.setAttribute('data-index', String(i));
      pill.innerHTML = esc(tags[i]) + '<button class="wh-tag-remove" data-index="' + i + '">\\u00D7</button>';
      container.insertBefore(pill, inp);
    }
  }

  function addTag(val) {
    var cleaned = cleanTag(val);
    if (!cleaned) return;
    if (tags.indexOf(cleaned) !== -1) return; // no duplicates
    tags.push(cleaned);
    renderTags();
  }

  function removeTag(index) {
    tags.splice(index, 1);
    renderTags();
    textInput.focus();
  }

  var textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.className = 'wh-tag-text';
  textInput.placeholder = tags.length === 0 ? 'Type and press Enter to add tags...' : '';
  container.appendChild(textInput);

  renderTags();

  container.addEventListener('click', function(e) {
    if (e.target.classList.contains('wh-tag-remove')) {
      removeTag(parseInt(e.target.dataset.index, 10));
      return;
    }
    textInput.focus();
  });

  textInput.addEventListener('keydown', function(e) {
    if ((e.key === 'Enter' || e.key === 'Tab' || e.key === ',') && textInput.value.trim()) {
      e.preventDefault();
      addTag(textInput.value);
      textInput.value = '';
      textInput.placeholder = '';
    }
    if (e.key === 'Backspace' && textInput.value === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
      renderFieldValue(el, currentValue);
    }
  });

  // Commit typed text on blur too
  textInput.addEventListener('input', function() {
    // Auto-create pill if comma typed
    if (textInput.value.indexOf(',') !== -1) {
      var parts = textInput.value.split(',');
      for (var i = 0; i < parts.length - 1; i++) { addTag(parts[i]); }
      textInput.value = parts[parts.length - 1];
    }
  });

  function cleanup() {
    document.removeEventListener('mousedown', onDocClick);
  }

  function saveTags() {
    // Commit any remaining text
    if (textInput.value.trim()) { addTag(textInput.value); textInput.value = ''; }
    cleanup();
    var newValue = tags.join(', ');
    if (newValue !== currentValue) {
      saveField(el, entityId, 'tags', newValue);
    } else {
      renderFieldValue(el, currentValue);
    }
  }

  function onDocClick(e) {
    if (!el.contains(e.target)) {
      saveTags();
    }
  }
  setTimeout(function() {
    document.addEventListener('mousedown', onDocClick);
  }, 50);

  textInput.focus();
}

function renderFieldValue(el, value) {
  var field = el.dataset.field;
  var tag = el.dataset.tag;
  el.dataset.value = value;
  if (!value) {
    el.innerHTML = '<span class="empty">\\u2014</span>';
  } else if (field === 'domain') {
    el.innerHTML = domainBadge(value);
  } else if (field === 'severity') {
    el.innerHTML = severityBadge(value);
  } else if (field === 'status' || field === 'category') {
    el.innerHTML = '<span class="wh-badge">' + esc(value) + '</span>';
  } else if (field === 'tags') {
    var tagArr = value ? value.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
    if (tagArr.length > 0) {
      var th = '<div class="wh-flex-wrap">';
      for (var ti = 0; ti < tagArr.length; ti++) th += '<span class="wh-tag">' + esc(tagArr[ti]) + '</span>';
      th += '</div>';
      el.innerHTML = th;
    } else {
      el.innerHTML = '<span class="empty">\\u2014</span>';
    }
  } else if (el.dataset.code) {
    el.innerHTML = '<code>' + esc(value) + '</code>';
  } else {
    el.textContent = value;
  }
}

async function saveField(el, id, field, newValue) {
  var entity = el.dataset.entity || 'rejection';
  var oldValue = el.dataset.value;
  if (newValue === oldValue) { renderFieldValue(el, oldValue); return; }
  if (field === 'domain' && !newValue.trim()) { renderFieldValue(el, oldValue); return; }
  if (field === 'title' && !newValue.trim()) { renderFieldValue(el, oldValue); return; }
  if (field === 'description' && !newValue.trim()) { renderFieldValue(el, oldValue); return; }
  if (field === 'rule' && !newValue.trim()) { renderFieldValue(el, oldValue); return; }
  var body = {};
  if (field === 'tags') {
    body[field] = newValue ? newValue.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
  } else {
    body[field] = newValue || null;
  }
  var endpoint = entity === 'constraint' ? '/api/constraint/' : '/api/rejection/';
  try {
    var res = await fetch(endpoint + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) { var err = await res.json(); alert(err.error || 'Save failed'); renderFieldValue(el, oldValue); return; }
    renderFieldValue(el, newValue);
    el.classList.add('wh-field-saved');
    setTimeout(function() { el.classList.remove('wh-field-saved'); }, 600);
    refresh();
  } catch(err) { alert(err.message); renderFieldValue(el, oldValue); }
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

async function linkRejection(rejectionId, domain) {
  var container = document.getElementById('link-target-' + rejectionId);
  if (!container) return;
  container.innerHTML = '<span class="text-muted text-xs">Loading constraints...</span>';

  try {
    var constraints = await fetchJson('/api/constraints/all');
    var select = document.createElement('select');

    // Add placeholder option
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a constraint...';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    // Group: same-domain first, then others
    var sameDomain = [];
    var otherDomain = [];
    for (var i = 0; i < constraints.length; i++) {
      if (constraints[i].domain === domain) {
        sameDomain.push(constraints[i]);
      } else {
        otherDomain.push(constraints[i]);
      }
    }

    function addConstraintOption(parent, c) {
      var opt = document.createElement('option');
      opt.value = c.id;
      var label = c.title || c.id;
      if (label.length > 90) label = label.substring(0, 87) + '...';
      if (c.domain && c.domain !== domain) label += ' [' + c.domain + ']';
      opt.textContent = label;
      parent.appendChild(opt);
    }

    if (sameDomain.length > 0) {
      var group = document.createElement('optgroup');
      group.label = domain;
      for (var i = 0; i < sameDomain.length; i++) addConstraintOption(group, sameDomain[i]);
      select.appendChild(group);
    }
    if (otherDomain.length > 0) {
      var group = document.createElement('optgroup');
      group.label = 'Other domains';
      for (var i = 0; i < otherDomain.length; i++) addConstraintOption(group, otherDomain[i]);
      select.appendChild(group);
    }

    container.innerHTML = '';
    container.appendChild(select);

    var choices = new Choices(select, {
      searchEnabled: true,
      shouldSort: false,
      itemSelectText: '',
      searchPlaceholderValue: 'Search constraints...',
    });

    select.addEventListener('change', async function() {
      var constraintId = select.value;
      if (!constraintId) return;
      choices.destroy();
      container.innerHTML = '<span class="text-muted text-xs">Linking...</span>';
      try {
        var res = await fetch('/api/rejection/' + encodeURIComponent(rejectionId) + '/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ constraint_id: constraintId })
        });
        var data = await res.json();
        if (!res.ok) { alert(data.error || 'Link failed'); }
        openRejection(rejectionId);
        refresh();
      } catch(err) { alert(err.message); openRejection(rejectionId); }
    });

    select.addEventListener('hideDropdown', function() {
      setTimeout(function() {
        if (container.querySelector('.choices') && !container.querySelector('.choices.is-open')) {
          choices.destroy();
          container.innerHTML = '<button onclick="linkRejection(\\'' + esc(rejectionId) + '\\', \\'' + esc(domain) + '\\')" class="text-accent border border-accent/30 bg-glow-accent rounded-md text-[11px] px-3 py-1.5 cursor-pointer hover:bg-accent hover:text-surface transition-colors">Link to Constraint</button>';
        }
      }, 200);
    });

    choices.showDropdown();
  } catch(err) {
    container.innerHTML = '<span class="text-red text-xs">Error: ' + esc(err.message) + '</span>';
  }
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
    var html = '<div class="flex items-start justify-between px-6 pt-6 pb-5 border-b border-edge sticky top-0 bg-card/95 backdrop-blur-md rounded-t-xl z-10">';
    html += '<div><div class="text-[11px] font-mono text-muted uppercase tracking-widest mb-2">Rejection</div>';
    html += '<h2 class="text-base font-semibold text-primary leading-snug">' + esc(r.description) + '</h2></div>';
    html += '<button class="bg-transparent border-none text-muted text-xl cursor-pointer leading-none hover:text-primary hover:bg-raised ml-4 shrink-0 w-8 h-8 flex items-center justify-center rounded-md transition-colors" onclick="closeModal()">\\u00D7</button></div>';
    html += '<div class="p-6 flex flex-col gap-5">';
    html += editableField(r.id, 'domain', 'Domain', r.domain);
    html += editableField(r.id, 'description', 'Description', r.description);
    html += editableField(r.id, 'reasoning', 'Reasoning', r.reasoning, { showEmpty: true });
    html += editableField(r.id, 'raw_output', 'Raw Output', r.raw_output, { code: true, showEmpty: true });
    if (r.constraint_id) {
      html += '<div class="wh-modal-field"><div class="wh-field-label">Encoded By</div><div class="wh-field-value flex items-center gap-3"><a href="#" onclick="event.preventDefault();openConstraint(\\'' + esc(r.constraint_id) + '\\')" class="text-accent no-underline font-mono text-xs">' + esc(r.constraint_id) + ' \\u2192 View constraint</a><button onclick="unlinkRejection(\\'' + esc(r.id) + '\\')" class="text-red border border-red/30 bg-glow-red rounded-md text-[11px] px-3 py-1.5 cursor-pointer hover:bg-red hover:text-surface transition-colors">Unlink</button></div></div>';
    } else {
      html += '<div class="wh-modal-field"><div class="wh-field-label">Encoded By</div><div class="wh-field-value" id="link-target-' + esc(r.id) + '"><button onclick="linkRejection(\\'' + esc(r.id) + '\\', \\'' + esc(r.domain) + '\\')" class="text-accent border border-accent/30 bg-glow-accent rounded-md text-[11px] px-3 py-1.5 cursor-pointer hover:bg-accent hover:text-surface transition-colors">Link to Constraint</button></div></div>';
    }
    html += '<hr class="border-none border-t border-edge-subtle">';
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
    var co = { entity: 'constraint' };
    var html = '<div class="flex items-start justify-between px-6 pt-6 pb-5 border-b border-edge sticky top-0 bg-card/95 backdrop-blur-md rounded-t-xl z-10">';
    html += '<div><div class="text-[11px] font-mono text-muted uppercase tracking-widest mb-2">Constraint</div>';
    html += '<h2 class="text-base font-semibold text-primary leading-snug">' + esc(c.title) + '</h2></div>';
    html += '<button class="bg-transparent border-none text-muted text-xl cursor-pointer leading-none hover:text-primary hover:bg-raised ml-4 shrink-0 w-8 h-8 flex items-center justify-center rounded-md transition-colors" onclick="closeModal()">\\u00D7</button></div>';
    html += '<div class="p-6 flex flex-col gap-5">';
    html += '<div class="wh-flex-wrap gap-2">';
    html += editableField(c.id, 'domain', 'Domain', c.domain, co);
    html += editableField(c.id, 'severity', 'Severity', c.severity, co);
    html += editableField(c.id, 'category', 'Category', c.category, co);
    html += editableField(c.id, 'status', 'Status', c.status, co);
    html += '</div>';
    html += editableField(c.id, 'title', 'Title', c.title, co);
    html += editableField(c.id, 'rule', 'Rule', c.rule, co);
    html += editableField(c.id, 'reasoning', 'Reasoning', c.reasoning, { entity: 'constraint', showEmpty: true });
    html += editableField(c.id, 'rejected_example', 'Bad Example', c.rejected_example, { entity: 'constraint', code: true, showEmpty: true });
    html += editableField(c.id, 'accepted_example', 'Good Example', c.accepted_example, { entity: 'constraint', code: true, showEmpty: true });
    // Tags
    var tags = null;
    try { tags = c.tags ? JSON.parse(c.tags) : null; } catch(e) { tags = c.tags ? [c.tags] : null; }
    var tagsStr = (tags && tags.length > 0) ? tags.join(', ') : '';
    html += editableField(c.id, 'tags', 'Tags', tagsStr, { entity: 'constraint', showEmpty: true });
    html += editableField(c.id, 'source', 'Source', c.source, { entity: 'constraint', showEmpty: true });
    html += '<hr class="border-none border-t border-edge-subtle">';
    html += modalField('Times Applied', String(c.times_applied || 0), { mono: true });
    html += modalField('Last Applied', c.last_applied_at ? formatDate(c.last_applied_at) : null, { mono: true, showEmpty: true });
    html += modalField('ID', c.id, { mono: true });
    html += modalField('Created', formatDate(c.created_at), { mono: true });
    html += modalField('Updated', formatDate(c.updated_at), { mono: true });
    // Linked rejections
    var linked = c.linked_rejections || [];
    html += '<hr class="border-none border-t border-edge-subtle">';
    html += '<div class="wh-modal-field"><div class="wh-field-label">Linked Rejections (' + linked.length + ')</div>';
    if (linked.length > 0) {
      html += '<div class="flex flex-col gap-2 mt-3">';
      for (var i = 0; i < linked.length; i++) {
        var lr = linked[i];
        html += '<div class="bg-raised cursor-pointer border border-edge-subtle hover:border-accent hover:bg-card transition-all duration-150 py-3 px-4 rounded-md" onclick="openRejection(\\'' + esc(lr.id) + '\\')">';
        html += '<div class="flex justify-between items-start gap-3">';
        html += '<div><div class="text-[13px] text-primary">' + esc(lr.description) + '</div>';
        html += '<div class="text-[11px] text-muted mt-1">' + esc(lr.domain) + ' \\u00B7 ' + timeAgo(lr.created_at) + '</div></div>';
        html += '<button onclick="event.stopPropagation();unlinkFromConstraint(\\'' + esc(lr.id) + '\\',\\'' + esc(c.id) + '\\')" class="text-red border border-red/30 bg-glow-red rounded-md text-[10px] px-3 py-1.5 cursor-pointer shrink-0 hover:bg-red hover:text-surface transition-colors">Unlink</button>';
        html += '</div></div>';
      }
      html += '</div>';
    } else {
      html += '<div class="wh-field-value empty">\\u2014</div>';
    }
    html += '</div>';
    if (linked.length === 0) {
      html += '<div class="text-center py-4 border-t border-edge-subtle">';
      html += '<button onclick="deleteConstraint(\\'' + esc(c.id) + '\\')" class="text-red border border-red/30 bg-glow-red rounded-md text-[13px] py-3 px-5 cursor-pointer hover:bg-red hover:text-surface transition-colors font-medium">Delete Constraint</button>';
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
    return '<details class="clickable py-4 border-b border-edge text-sm" onclick="if(!event.target.closest(\\'summary\\')){return}event.preventDefault();openConstraint(\\'' + esc(c.id) + '\\')">' +
      '<summary class="cursor-pointer flex items-start gap-2"><div>' +
      '<div class="title text-primary font-medium">' + esc(c.title) + '</div>' +
      '<div class="meta wh-flex-wrap text-xs text-muted mt-2">' + domainBadge(c.domain) + severityBadge(c.severity) + (extraMeta || '') + '</div>' +
      '</div></summary>' +
      '</details>';
  }
  return '<div class="wh-list-item clickable" onclick="openConstraint(\\'' + esc(c.id) + '\\')">' +
    '<div class="title text-primary font-medium">' + esc(c.title) + '</div>' +
    '<div class="meta wh-flex-wrap text-xs text-muted mt-2">' + domainBadge(c.domain) + severityBadge(c.severity) + (extraMeta || '') + '</div></div>';
}
`;
