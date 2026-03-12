// <whet-constraints> — Constraints page with filters, summary stats, and list.
// Owns filter state and data fetching.
// Exposes load() for <whet-app> to call on page switch/refresh.

export const CONSTRAINTS = `
class WhetConstraints extends WhetBase {
  connectedCallback() {
    super.connectedCallback();
    this._searchTimer = null;
    this._choicesReady = false;
    this.innerHTML = this._template();

    // Expose global wrappers for backward compat with onclick handlers
    var self = this;
    window.applyConstraintFilters = function() { self.load(); };
    window.debounceConstraintSearch = function() { self._debounceSearch(); };
    window.clearConstraintFilters = function() { self._clearFilters(); };
    window.loadConstraintsPage = function() { self.load(); };
  }

  _template() {
    return '<div class="wh-page">' +
      '<div class="wh-filter-bar">' +
      '<select id="cf-domain" class="wh-filter-select"><option value="">All Domains</option></select>' +
      '<select id="cf-severity" class="wh-filter-select">' +
        '<option value="">All Severities</option>' +
        '<option value="critical">Critical</option>' +
        '<option value="important">Important</option>' +
        '<option value="preference">Preference</option>' +
      '</select>' +
      '<select id="cf-status" class="wh-filter-select">' +
        '<option value="">All Statuses</option>' +
        '<option value="active">Active</option>' +
        '<option value="deprecated">Deprecated</option>' +
        '<option value="superseded">Superseded</option>' +
      '</select>' +
      '<select id="cf-category" class="wh-filter-select"><option value="">All Categories</option></select>' +
      '<select id="cf-sort" class="wh-filter-select">' +
        '<option value="newest">Newest First</option>' +
        '<option value="applied">Most Applied</option>' +
        '<option value="severity">Severity</option>' +
        '<option value="alpha">Alphabetical</option>' +
      '</select>' +
      '<input type="text" id="cf-search" class="wh-filter-input" placeholder="Search constraints..." oninput="debounceConstraintSearch()">' +
      '<button class="wh-filter-btn" onclick="clearConstraintFilters()">Clear</button>' +
    '</div>' +
    '<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4" id="constraints-summary"></div>' +
    '<div>' +
      '<div id="constraints-count" class="text-xs text-muted mb-4 font-mono tracking-wide"></div>' +
      '<div id="constraints-list" class="grid grid-cols-1 lg:grid-cols-2 gap-4"></div>' +
    '</div>' +
    '</div>';
  }

  _debounceSearch() {
    var self = this;
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(function() { self.load(); }, 300);
  }

  _initChoices() {
    if (this._choicesReady) return;
    if (typeof Choices === 'undefined') return;
    var self = this;
    var ids = ['cf-domain', 'cf-severity', 'cf-status', 'cf-category', 'cf-sort'];
    for (var i = 0; i < ids.length; i++) {
      (function(id) {
        var el = document.getElementById(id);
        if (!el || el._choices) return;
        var c = new Choices(el, {
          searchEnabled: false,
          shouldSort: false,
          itemSelectText: '',
          allowHTML: false,
        });
        el._choices = c;
        el.addEventListener('change', function() { self.load(); });
      })(ids[i]);
    }
    this._choicesReady = true;
  }

  _clearFilters() {
    var ids = ['cf-domain', 'cf-severity', 'cf-status', 'cf-category'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && el._choices) el._choices.setChoiceByValue('');
      else if (el) el.value = '';
    }
    var sortEl = document.getElementById('cf-sort');
    if (sortEl && sortEl._choices) sortEl._choices.setChoiceByValue('newest');
    else if (sortEl) sortEl.value = 'newest';
    document.getElementById('cf-search').value = '';
    this.load();
  }

  _buildFilterParams() {
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

  _populateDropdowns(summary) {
    var domainEl = document.getElementById('cf-domain');
    var curDomain = domainEl.value;
    var domains = summary.by_domain || [];
    var domainOpts = [{ value: '', label: 'All Domains' }];
    for (var i = 0; i < domains.length; i++) {
      domainOpts.push({ value: domains[i].domain, label: domains[i].domain + ' (' + domains[i].count + ')' });
    }
    if (domainEl._choices) {
      domainEl._choices.clearChoices();
      domainEl._choices.setChoices(domainOpts, 'value', 'label', true);
      if (curDomain) domainEl._choices.setChoiceByValue(curDomain);
    } else {
      domainEl.innerHTML = '';
      for (var di = 0; di < domainOpts.length; di++) {
        domainEl.innerHTML += '<option value="' + esc(domainOpts[di].value) + '">' + esc(domainOpts[di].label) + '</option>';
      }
      domainEl.value = curDomain;
    }

    var catEl = document.getElementById('cf-category');
    var curCat = catEl.value;
    var cats = summary.by_category || [];
    var catOpts = [{ value: '', label: 'All Categories' }];
    for (var j = 0; j < cats.length; j++) {
      catOpts.push({ value: cats[j].category, label: cats[j].category + ' (' + cats[j].count + ')' });
    }
    if (catEl._choices) {
      catEl._choices.clearChoices();
      catEl._choices.setChoices(catOpts, 'value', 'label', true);
      if (curCat) catEl._choices.setChoiceByValue(curCat);
    } else {
      catEl.innerHTML = '';
      for (var ci = 0; ci < catOpts.length; ci++) {
        catEl.innerHTML += '<option value="' + esc(catOpts[ci].value) + '">' + esc(catOpts[ci].label) + '</option>';
      }
      catEl.value = curCat;
    }
  }

  _renderSummary(summary) {
    var el = document.getElementById('constraints-summary');
    var total = summary.total || 0;
    var statusMap = {};
    var byStatus = summary.by_status || [];
    for (var i = 0; i < byStatus.length; i++) statusMap[byStatus[i].status] = byStatus[i].count;
    var sevMap = {};
    var bySev = summary.by_severity || [];
    for (var j = 0; j < bySev.length; j++) sevMap[bySev[j].severity] = bySev[j].count;

    var curStatus = document.getElementById('cf-status').value;
    var curSev = document.getElementById('cf-severity').value;

    el.innerHTML =
      renderStat(total, 'Total', { href: { page: 'constraints', toggle: { field: 'status', value: '' } } }) +
      renderStat(statusMap.active || 0, 'Active', { good: !curStatus || curStatus === 'active', href: { page: 'constraints', toggle: { field: 'status', value: 'active' } } }) +
      renderStat(statusMap.deprecated || 0, 'Deprecated', { href: { page: 'constraints', toggle: { field: 'status', value: 'deprecated' } } }) +
      renderStat(statusMap.superseded || 0, 'Superseded', { href: { page: 'constraints', toggle: { field: 'status', value: 'superseded' } } }) +
      renderStat(sevMap.critical || 0, 'Critical', { color: 'var(--color-red)', href: { page: 'constraints', toggle: { field: 'severity', value: 'critical' } } }) +
      renderStat(sevMap.important || 0, 'Important', { color: 'var(--color-yellow)', href: { page: 'constraints', toggle: { field: 'severity', value: 'important' } } }) +
      renderStat(sevMap.preference || 0, 'Preference', { color: 'var(--color-purple)', href: { page: 'constraints', toggle: { field: 'severity', value: 'preference' } } });

    // Highlight the active filter card
    var cards = el.querySelectorAll('.wh-stat-clickable');
    cards.forEach(function(card) {
      var t = card.dataset.toggleField;
      var v = card.dataset.toggleValue;
      if ((t === 'status' && curStatus === v && v !== '') || (t === 'severity' && curSev === v && v !== '')) {
        card.classList.add('wh-stat-active');
      }
    });
  }

  _renderList(constraints) {
    var countEl = document.getElementById('constraints-count');
    var el = document.getElementById('constraints-list');
    countEl.innerHTML = constraints.length + ' constraint' + (constraints.length !== 1 ? 's' : '');

    if (constraints.length === 0) {
      el.innerHTML = '<div class="wh-empty">No constraints match the current filters</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < constraints.length; i++) {
      var c = constraints[i];
      var statusBadge = c.status !== 'active' ? '<span class="wh-badge">' + esc(c.status) + '</span>' : '';
      var linkedCount = c.linked_rejection_count || 0;
      var appliedText = c.times_applied > 0 ? '<span class="text-green">Applied ' + c.times_applied + 'x</span>' : 'Never applied';
      var staleIndicator = '';
      if (c.status === 'active' && c.times_applied === 0) {
        var ageMs = Date.now() - new Date(c.created_at).getTime();
        if (ageMs > 7 * 86400000) staleIndicator = ' \\u00B7 <span class="text-yellow bg-glow-yellow px-2 py-px rounded text-[10px] font-semibold uppercase" title="Never applied, older than 7 days">stale</span>';
      }

      // Parse tags
      var tagsHtml = '';
      try {
        var tags = c.tags ? JSON.parse(c.tags) : null;
        if (tags && tags.length > 0) {
          for (var t = 0; t < tags.length; t++) tagsHtml += '<span class="wh-tag">' + esc(tags[t]) + '</span>';
        }
      } catch(e) {}

      html += '<div class="wh-card" onclick="openConstraint(\\'' + esc(c.id) + '\\')">';
      html += '<div class="text-sm font-medium text-primary mb-2">' + esc(c.title) + '</div>';
      html += '<div class="text-[13px] text-muted leading-normal line-clamp-2 mb-3">' + esc(c.rule) + '</div>';
      html += '<div class="wh-flex-wrap">';
      html += domainBadge(c.domain) + severityBadge(c.severity) + '<span class="wh-badge">' + esc(c.category) + '</span>' + statusBadge;
      if (tagsHtml) html += tagsHtml;
      html += '</div>';
      html += '<div class="mt-3 pt-3 border-t border-edge-subtle text-[11px] font-mono text-muted">';
      html += appliedText + ' \\u00B7 ' + linkedCount + ' rejection' + (linkedCount !== 1 ? 's' : '') + ' \\u00B7 ' + timeAgo(c.created_at) + staleIndicator;
      html += '</div>';
      html += '</div>';
    }
    el.innerHTML = html;
  }

  async load() {
    var params = this._buildFilterParams();
    try {
      var results = await Promise.all([
        fetchJson('/api/constraints/all' + params),
        fetchJson('/api/constraints/summary')
      ]);
      this._initChoices();
      this._populateDropdowns(results[1]);
      this._renderSummary(results[1]);
      this._renderList(results[0]);
    } catch(err) {
      document.getElementById('constraints-list').innerHTML = '<div class="wh-empty">Error: ' + esc(err.message) + '</div>';
    }
  }
}
customElements.define('whet-constraints', WhetConstraints);
`;
