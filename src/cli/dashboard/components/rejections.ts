// <whet-rejections> — Rejections page with filters, summary stats, patterns, and list.
// Owns filter state and data fetching.
// Exposes load() for <whet-app> to call on page switch/refresh.

export const REJECTIONS = `
class WhetRejections extends WhetBase {
  connectedCallback() {
    super.connectedCallback();
    this._searchTimer = null;
    this._choicesReady = false;
    this.innerHTML = this._template();

    // Expose global wrappers for backward compat with onclick handlers
    var self = this;
    window.applyRejectionFilters = function() { self.load(); };
    window.debounceRejectionSearch = function() { self._debounceSearch(); };
    window.clearRejectionFilters = function() { self._clearFilters(); };
    window.loadRejectionsPage = function() { self.load(); };
  }

  _template() {
    return '<div class="wh-page">' +
      '<div class="wh-filter-bar">' +
      '<select id="rf-domain" class="wh-filter-select"><option value="">All Domains</option></select>' +
      '<select id="rf-encoded" class="wh-filter-select">' +
        '<option value="">All</option>' +
        '<option value="no">Unencoded</option>' +
        '<option value="yes">Encoded</option>' +
      '</select>' +
      '<select id="rf-sort" class="wh-filter-select">' +
        '<option value="newest">Newest First</option>' +
        '<option value="oldest">Oldest First</option>' +
      '</select>' +
      '<input type="text" id="rf-search" class="wh-filter-input" placeholder="Search rejections..." oninput="debounceRejectionSearch()">' +
      '<button class="wh-filter-btn" onclick="clearRejectionFilters()">Clear</button>' +
    '</div>' +
    '<div class="grid grid-cols-2 sm:grid-cols-4 gap-4" id="rejections-summary"></div>' +
    '<section class="wh-section" id="rej-patterns-section">' +
      '<h2>Patterns <span class="text-[11px] text-muted font-mono font-normal">\\u2014 recurring themes in unencoded rejections</span></h2>' +
      '<div id="rej-patterns-list"></div>' +
    '</section>' +
    '<div>' +
      '<div id="rejections-count" class="text-xs text-muted mb-4 font-mono tracking-wide"></div>' +
      '<div id="rejections-list" class="grid grid-cols-1 lg:grid-cols-2 gap-4"></div>' +
    '</div>' +
    '</div>';
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

  _initChoices() {
    if (this._choicesReady) return;
    if (typeof Choices === 'undefined') return;
    var self = this;
    var ids = ['rf-domain', 'rf-encoded', 'rf-sort'];
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
    var resetMap = { 'rf-domain': '', 'rf-encoded': '', 'rf-sort': 'newest' };
    var keys = Object.keys(resetMap);
    for (var i = 0; i < keys.length; i++) {
      var el = document.getElementById(keys[i]);
      if (el && el._choices) el._choices.setChoiceByValue(resetMap[keys[i]]);
      else if (el) el.value = resetMap[keys[i]];
    }
    document.getElementById('rf-search').value = '';
    this.load();
  }

  _populateDropdowns(summary) {
    var domainEl = document.getElementById('rf-domain');
    var cur = domainEl.value;
    var domains = summary.by_domain || [];
    var domainOpts = [{ value: '', label: 'All Domains' }];
    for (var i = 0; i < domains.length; i++) {
      domainOpts.push({ value: domains[i].domain, label: domains[i].domain + ' (' + domains[i].count + ')' });
    }
    if (domainEl._choices) {
      domainEl._choices.clearChoices();
      domainEl._choices.setChoices(domainOpts, 'value', 'label', true);
      if (cur) domainEl._choices.setChoiceByValue(cur);
    } else {
      domainEl.innerHTML = '';
      for (var di = 0; di < domainOpts.length; di++) {
        domainEl.innerHTML += '<option value="' + esc(domainOpts[di].value) + '">' + esc(domainOpts[di].label) + '</option>';
      }
      domainEl.value = cur;
    }
  }

  _renderSummary(summary) {
    var el = document.getElementById('rejections-summary');
    var curEncoded = document.getElementById('rf-encoded').value;

    el.innerHTML =
      renderStat(summary.total || 0, 'Total', { href: { page: 'rejections', toggle: { field: 'encoded', value: '' } } }) +
      renderStat(summary.unencoded || 0, 'Unencoded', { color: 'var(--color-yellow)', href: { page: 'rejections', toggle: { field: 'encoded', value: 'no' } } }) +
      renderStat(summary.encoded || 0, 'Encoded', { good: !curEncoded || curEncoded === 'yes', href: { page: 'rejections', toggle: { field: 'encoded', value: 'yes' } } }) +
      renderStat((summary.by_domain || []).length, 'Domains');

    var cards = el.querySelectorAll('.wh-stat-clickable');
    cards.forEach(function(card) {
      var v = card.dataset.toggleValue;
      if (curEncoded === v && v !== '') {
        card.classList.add('wh-stat-active');
      }
    });
  }

  _renderPatterns(patternsData) {
    var section = document.getElementById('rej-patterns-section');
    var el = document.getElementById('rej-patterns-list');
    if (!patternsData || patternsData.length === 0) {
      section.style.display = '';
      el.innerHTML = '<div class="wh-empty">No recurring patterns detected right now.</div>';
      return;
    }
    section.style.display = '';
    var html = '';
    for (var i = 0; i < patternsData.length; i++) {
      var p = patternsData[i];

      // Velocity indicator
      var velocityHtml = '';
      if (p.velocity >= 3) velocityHtml = ' \\u00B7 <span class="text-red font-semibold">\\u26A1 accelerating rapidly</span>';
      else if (p.velocity >= 1.5) velocityHtml = ' \\u00B7 <span class="text-yellow font-semibold">\\u2191 accelerating</span>';

      html += '<div class="bg-gradient-to-br from-orange/10 to-orange/5 border border-orange rounded-lg py-4 px-5 mb-3">';
      html += '<div class="flex items-center gap-4">';
      html += '<div class="bg-orange text-surface rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0 shadow-[0_0_8px_rgba(240,136,62,0.3)]">' + p.count + '</div>';
      html += '<div class="flex-1"><div class="text-[13px] text-primary">' + esc(p.theme) + '</div>';
      html += '<div class="text-[11px] text-muted mt-1">' + esc(p.domain) + ' \\u00B7 ' + p.count + ' similar rejections' + velocityHtml + '</div>';
      html += '</div></div>';

      // Suggested constraint
      if (p.suggested_constraint) {
        var sc = p.suggested_constraint;
        html += '<div class="mt-3 pt-3 border-t border-orange/20 text-[12px]">';
        html += '<span class="text-accent font-mono">Suggested:</span> ';
        html += '<span class="text-primary font-medium">' + esc(sc.title) + '</span>';
        html += ' <span class="text-muted">\\u2014 ' + esc(sc.category) + '</span>';
        html += '</div>';
      }

      html += '</div>';
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
      html += '<div class="wh-flex-wrap">';
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
      this._initChoices();
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
