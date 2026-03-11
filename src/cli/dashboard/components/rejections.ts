// <whet-rejections> — Rejections page with filters, summary stats, patterns, and list.
// Owns filter state and data fetching.
// Exposes load() for <whet-app> to call on page switch/refresh.

export const REJECTIONS = `
class WhetRejections extends WhetBase {
  connectedCallback() {
    super.connectedCallback();
    this._searchTimer = null;
    this.innerHTML = this._template();

    // Expose global wrappers for backward compat with onclick handlers
    var self = this;
    window.applyRejectionFilters = function() { self.load(); };
    window.debounceRejectionSearch = function() { self._debounceSearch(); };
    window.clearRejectionFilters = function() { self._clearFilters(); };
    window.loadRejectionsPage = function() { self.load(); };
  }

  _template() {
    return '<div class="wh-filter-bar">' +
      '<select id="rf-domain" class="wh-filter-select" onchange="applyRejectionFilters()"><option value="">All Domains</option></select>' +
      '<select id="rf-encoded" class="wh-filter-select" onchange="applyRejectionFilters()">' +
        '<option value="">All</option>' +
        '<option value="no">Unencoded</option>' +
        '<option value="yes">Encoded</option>' +
      '</select>' +
      '<select id="rf-sort" class="wh-filter-select" onchange="applyRejectionFilters()">' +
        '<option value="newest">Newest First</option>' +
        '<option value="oldest">Oldest First</option>' +
      '</select>' +
      '<input type="text" id="rf-search" class="wh-filter-input" placeholder="Search rejections..." oninput="debounceRejectionSearch()">' +
      '<button class="wh-filter-btn" onclick="clearRejectionFilters()">Clear</button>' +
    '</div>' +
    '<div class="grid grid-cols-4 gap-4 mb-8 max-sm:grid-cols-2" id="rejections-summary"></div>' +
    '<section class="wh-section" id="rej-patterns-section" style="display:none">' +
      '<h2>Patterns <span class="text-[11px] text-muted font-mono font-normal">\\u2014 recurring themes in unencoded rejections</span></h2>' +
      '<div id="rej-patterns-list"></div>' +
    '</section>' +
    '<div id="rejections-count" class="text-xs text-muted mb-4 font-mono tracking-wide"></div>' +
    '<div id="rejections-list"></div>';
  }

  _buildFilterParams() {
    var parts = [];
    var d = document.getElementById('rf-domain').value;
    var enc = document.getElementById('rf-encoded').value;
    var sort = document.getElementById('rf-sort').value;
    var q = document.getElementById('rf-search').value.trim();
    if (d) parts.push('domain=' + encodeURIComponent(d));
    if (enc) parts.push('encoded=' + encodeURIComponent(enc));
    if (sort) parts.push('sort=' + encodeURIComponent(sort));
    if (q) parts.push('q=' + encodeURIComponent(q));
    return parts.length > 0 ? '?' + parts.join('&') : '';
  }

  _debounceSearch() {
    var self = this;
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(function() { self.load(); }, 300);
  }

  _clearFilters() {
    document.getElementById('rf-domain').value = '';
    document.getElementById('rf-encoded').value = '';
    document.getElementById('rf-sort').value = 'newest';
    document.getElementById('rf-search').value = '';
    this.load();
  }

  _populateDropdowns(summary) {
    var domainEl = document.getElementById('rf-domain');
    var cur = domainEl.value;
    domainEl.innerHTML = '<option value="">All Domains</option>';
    var domains = summary.by_domain || [];
    for (var i = 0; i < domains.length; i++) {
      domainEl.innerHTML += '<option value="' + esc(domains[i].domain) + '">' + esc(domains[i].domain) + ' (' + domains[i].count + ')</option>';
    }
    domainEl.value = cur;
  }

  _renderSummary(summary) {
    var el = document.getElementById('rejections-summary');
    el.innerHTML =
      '<whet-stat-card value="' + (summary.total || 0) + '" label="Total"></whet-stat-card>' +
      '<whet-stat-card value="' + (summary.unencoded || 0) + '" label="Unencoded" value-color="var(--color-yellow)"></whet-stat-card>' +
      '<whet-stat-card value="' + (summary.encoded || 0) + '" label="Encoded" value-class="good"></whet-stat-card>' +
      '<whet-stat-card value="' + ((summary.by_domain || []).length) + '" label="Domains"></whet-stat-card>';
  }

  _renderPatterns(patternsData) {
    var section = document.getElementById('rej-patterns-section');
    var el = document.getElementById('rej-patterns-list');
    if (!patternsData || patternsData.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    var html = '';
    for (var i = 0; i < patternsData.length; i++) {
      var p = patternsData[i];
      html += '<div class="bg-gradient-to-br from-orange/10 to-orange/5 border border-orange rounded-lg py-4 px-5 mb-3 flex items-center gap-3.5">';
      html += '<div class="bg-orange text-surface rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0 shadow-[0_0_8px_rgba(240,136,62,0.3)]">' + p.count + '</div>';
      html += '<div><div class="text-[13px] text-primary">' + esc(p.theme) + '</div>';
      html += '<div class="text-[11px] text-muted mt-0.5">' + esc(p.domain) + ' \\u00B7 ' + p.count + ' similar rejections \\u00B7 ' + (p.sample_ids ? p.sample_ids.length : 0) + ' samples</div>';
      html += '</div></div>';
    }
    el.innerHTML = html;
  }

  _renderList(rejections) {
    var countEl = document.getElementById('rejections-count');
    var el = document.getElementById('rejections-list');
    countEl.innerHTML = rejections.length + ' rejection' + (rejections.length !== 1 ? 's' : '');

    if (rejections.length === 0) {
      el.innerHTML = '<div class="wh-empty">No rejections match the current filters</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < rejections.length; i++) {
      var r = rejections[i];
      var encodedHtml = '';
      if (r.constraint_id) {
        encodedHtml = '<div class="text-[11px] text-accent font-mono">\\u2192 ' + esc(r.constraint_title || r.constraint_id) + '</div>';
      } else {
        encodedHtml = '<span class="text-[11px] text-yellow">unencoded</span>';
      }

      html += '<div class="wh-card" onclick="openRejection(\\'' + esc(r.id) + '\\')">';
      html += '<div class="text-sm font-medium text-primary mb-2">' + esc(r.description) + '</div>';
      if (r.reasoning) html += '<div class="text-[13px] text-muted leading-normal line-clamp-2 mb-3">' + esc(r.reasoning) + '</div>';
      html += '<div class="flex flex-wrap gap-2 items-center">';
      html += domainBadge(r.domain) + ' ' + encodedHtml;
      html += '</div>';
      html += '<div class="mt-3 pt-3 border-t border-edge-subtle text-[11px] font-mono text-muted">' + timeAgo(r.created_at) + '</div>';
      html += '</div>';
    }
    el.innerHTML = html;
  }

  async load() {
    var params = this._buildFilterParams();
    try {
      var results = await Promise.all([
        fetchJson('/api/rejections/all' + params),
        fetchJson('/api/rejections/summary'),
        fetchJson('/api/patterns')
      ]);
      this._populateDropdowns(results[1]);
      this._renderSummary(results[1]);
      this._renderPatterns(results[2]);
      this._renderList(results[0]);
    } catch(err) {
      document.getElementById('rejections-list').innerHTML = '<div class="wh-empty">Error: ' + esc(err.message) + '</div>';
    }
  }
}
customElements.define('whet-rejections', WhetRejections);
`;
