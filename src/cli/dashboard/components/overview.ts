// <whet-overview> — Overview page with stats, domain bars, and insight sections.
// Receives data via load(stats, listResult, patternsData) from <whet-app>.
// Exposes global wrappers for backward compat with onclick handlers.

export const OVERVIEW = `
class WhetOverview extends WhetBase {
  connectedCallback() {
    super.connectedCallback();
    this.innerHTML = this._template();

    // Expose global wrappers for onclick handlers
    var self = this;
    window.toggleAppliedList = function(btn) { self._toggleAppliedList(btn); };
    window.toggleUnencodedList = function(btn) { self._toggleUnencodedList(btn); };
  }

  _template() {
    return '<div class="wh-page">' +
      '<section class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" id="stats-cards"></section>' +
      '<section class="wh-section" id="patterns-section">' +
        '<h2>Encode These Next <span class="text-[11px] text-muted font-mono font-normal">\\u2014 recurring rejection patterns without constraints</span></h2>' +
        '<div id="patterns-list"></div>' +
      '</section>' +
      '<section class="grid grid-cols-1 lg:grid-cols-2 gap-4">' +
        '<div class="wh-section"><h2>Rejections by Domain</h2><div id="domain-bars" class="relative"></div></div>' +
        '<div class="wh-section"><h2>Most Applied Constraints</h2><div id="applied-list"></div></div>' +
      '</section>' +
      '<section class="grid grid-cols-1 lg:grid-cols-2 gap-4">' +
        '<div class="wh-section"><h2>Unencoded Rejections</h2><div id="unencoded-list"></div></div>' +
        '<div class="wh-section"><h2>Recently Encoded</h2><div id="recently-encoded-list"></div></div>' +
      '</section>' +
      '<section class="grid grid-cols-1 lg:grid-cols-2 gap-4" id="gaps-graduation-section" style="display:none">' +
        '<div class="wh-section" id="domain-gaps-section"><h2>Domain Gaps <span class="text-[11px] text-muted font-mono font-normal">\\u2014 taste being lost</span></h2><div id="domain-gaps-list"></div></div>' +
        '<div class="wh-section" id="graduation-section"><h2>Ready to Graduate <span class="text-[11px] text-muted font-mono font-normal">\\u2014 move to CLAUDE.md</span></h2><div id="graduation-list"></div></div>' +
      '</section>' +
      '<section class="grid grid-cols-1 lg:grid-cols-2 gap-4" id="dead-elevation-section">' +
        '<div class="wh-section" id="dead-section" style="display:none"><h2>Fading Constraints <span class="text-[11px] text-muted font-mono font-normal">\\u2014 applied before, silent now</span></h2><div id="dead-list"></div></div>' +
        '<div class="wh-section"><h2>Elevation Candidates</h2><div id="elevation-list"></div></div>' +
      '</section>' +
      '</div>';
  }

  async load() {
    var results = await Promise.all([
      fetchJson('/api/stats'),
      fetchJson('/api/list?status=unencoded&limit=30'),
      fetchJson('/api/patterns')
    ]);
    var stats = results[0];
    var listResult = results[1];
    var patternsData = results[2];
    this._renderStatsCards(stats);
    this._renderDomainBars(stats);
    this._renderMostApplied(stats);
    this._renderPatterns(patternsData);
    this._renderUnencoded(listResult);
    this._renderRecentlyEncoded(stats);
    this._renderDomainGaps(stats);
    this._renderGraduation(stats);
    this._renderDead(stats);
    this._renderElevation(stats);
  }

  _renderStatsCards(s) {
    var el = document.getElementById('stats-cards');
    var encoded = s.total_rejections - s.unencoded_rejections;
    var coveragePct = s.total_rejections > 0 ? Math.round((encoded / s.total_rejections) * 100) : 0;
    var wd = s.week_delta || {};
    var domainCount = (s.rejections_by_domain || []).length;
    el.innerHTML =
      renderStat(s.total_rejections, 'Rejections', { delta: deltaText(wd.rejections, 'this week'), href: { page: 'rejections' } }) +
      renderStat(s.total_constraints, 'Constraints', { delta: deltaText(wd.constraints, 'this week'), href: { page: 'constraints' } }) +
      renderStat(s.active_constraints, 'Active', { good: true, href: { page: 'constraints', filters: { status: 'active' } } }) +
      renderStat(s.unencoded_rejections, 'Unencoded', { warn: s.unencoded_rejections > 0, href: { page: 'rejections', filters: { encoded: 'no' } } }) +
      renderStat(coveragePct + '%', 'Coverage', { good: coveragePct >= 80, warn: coveragePct < 50, delta: deltaText(wd.encoded, 'encoded this week'), href: { page: 'constraints', filters: { status: 'active' } } }) +
      renderStat(domainCount, 'Domains');
  }

  _renderDomainBars(s) {
    var el = document.getElementById('domain-bars');
    var domains = s.rejections_by_domain || [];
    if (domains.length === 0) {
      el.innerHTML = '<div class="wh-empty">No rejections yet</div>';
      return;
    }
    var encodedMap = {};
    var enc = s.encoded_by_domain || [];
    for (var j = 0; j < enc.length; j++) {
      encodedMap[enc[j].domain] = enc[j].count;
    }
    var max = Math.max.apply(null, domains.map(function(d) { return d.count; }));
    var html = '<div class="bar-legend flex gap-4 mb-3 text-xs text-muted"><span class="legend-encoded">Encoded</span><span class="legend-unencoded">Unencoded</span></div>';
    html += '<div id="domain-bar-tooltip" class="bar-tooltip"></div>';
    for (var i = 0; i < domains.length; i++) {
      var d = domains[i];
      var encodedCount = encodedMap[d.domain] || 0;
      var unencodedCount = d.count - encodedCount;
      var encodedPct = max > 0 ? Math.round((encodedCount / max) * 100) : 0;
      var unencodedPct = max > 0 ? Math.round((unencodedCount / max) * 100) : 0;
      var activeClass = (_lastDrilldownDomain === d.domain) ? ' domain-bar-active' : '';
      html += '<div class="wh-flex-row mb-3 relative' + activeClass + '" data-domain="' + esc(d.domain) + '" data-encoded="' + encodedCount + '" data-unencoded="' + unencodedCount + '" data-total="' + d.count + '">' +
        '<div class="w-[120px] text-right text-[13px] font-mono text-muted shrink-0">' + esc(d.domain) + '</div>' +
        '<div class="flex-1 h-[22px] bg-raised rounded overflow-hidden flex">' +
          (encodedPct > 0 ? '<div class="bar-fill-encoded bar-segment-click h-full bg-green" data-filter="yes" style="width:' + encodedPct + '%" title="' + encodedCount + ' encoded"></div>' : '') +
          (unencodedPct > 0 ? '<div class="bar-fill-unencoded bar-segment-click h-full bg-orange" data-filter="no" style="width:' + unencodedPct + '%" title="' + unencodedCount + ' unencoded"></div>' : '') +
        '</div>' +
        '<div class="w-[60px] text-[13px] font-mono text-muted">' + encodedCount + '/' + d.count + '</div>' +
        '</div>';
    }
    el.innerHTML = html;
    this._setupBarTooltips(el);
  }

  _setupBarTooltips(container) {
    var tooltip = document.getElementById('domain-bar-tooltip');
    var rows = container.querySelectorAll('[data-domain]');
    for (var i = 0; i < rows.length; i++) {
      (function(row) {
        var domain = row.getAttribute('data-domain');
        var enc = row.getAttribute('data-encoded');
        var unenc = row.getAttribute('data-unencoded');
        var total = row.getAttribute('data-total');

        // Tooltip on row hover
        row.addEventListener('mouseenter', function() {
          tooltip.innerHTML = '<strong>' + domain + '</strong> &mdash; ' + enc + ' encoded, ' + unenc + ' unencoded (' + total + ' total)';
          tooltip.classList.add('visible');
        });
        row.addEventListener('mousemove', function(e) {
          var rect = container.getBoundingClientRect();
          tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
          tooltip.style.top = (e.clientY - rect.top - 30) + 'px';
        });
        row.addEventListener('mouseleave', function() {
          tooltip.classList.remove('visible');
        });

        // Click handlers on bar segments
        var segments = row.querySelectorAll('.bar-segment-click');
        for (var j = 0; j < segments.length; j++) {
          (function(seg) {
            seg.addEventListener('click', function() {
              navigateWithFilters('rejections', { domain: domain, encoded: seg.getAttribute('data-filter') });
            });
          })(segments[j]);
        }
      })(rows[i]);
    }
  }

  _renderMostApplied(s) {
    var el = document.getElementById('applied-list');
    var items = s.most_applied || [];
    if (items.length === 0) {
      el.innerHTML = '<div class="wh-empty">No constraints applied yet</div>';
      return;
    }
    var limit = 8;
    var showAll = items.length <= limit;
    var visible = showAll ? items : items.slice(0, limit);
    var html = '';
    for (var i = 0; i < visible.length; i++) {
      var c = visible[i];
      html += renderConstraintDetail(c, '<span class="text-green">Applied ' + c.times_applied + 'x</span>');
    }
    if (!showAll) {
      html += '<button class="wh-show-more" onclick="toggleAppliedList(this)" data-expanded="false">Show ' + (items.length - limit) + ' more</button>';
    }
    el.innerHTML = html;
    el._fullItems = items;
    el._limit = limit;
  }

  _toggleAppliedList(btn) {
    var el = document.getElementById('applied-list');
    var items = el._fullItems;
    var limit = el._limit;
    var expanded = btn.getAttribute('data-expanded') === 'true';
    var visible = expanded ? items.slice(0, limit) : items;
    var html = '';
    for (var i = 0; i < visible.length; i++) {
      var c = visible[i];
      html += renderConstraintDetail(c, '<span class="text-green">Applied ' + c.times_applied + 'x</span>');
    }
    if (expanded) {
      html += '<button class="wh-show-more" onclick="toggleAppliedList(this)" data-expanded="false">Show ' + (items.length - limit) + ' more</button>';
    } else {
      html += '<button class="wh-show-more" onclick="toggleAppliedList(this)" data-expanded="true">Show less</button>';
    }
    el.innerHTML = html;
    el._fullItems = items;
    el._limit = limit;
  }

  _renderUnencoded(listResult) {
    var el = document.getElementById('unencoded-list');
    var items = listResult.rejections || [];
    if (items.length === 0) {
      el.innerHTML = '<div class="wh-empty">All rejections are encoded \\u2014 nice work</div>';
      return;
    }
    var limit = 10;
    var visible = items.slice(0, limit);
    var html = '';
    for (var i = 0; i < visible.length; i++) {
      var r = visible[i];
      html += '<div class="wh-list-item clickable" onclick="openRejection(\\'' + esc(r.id) + '\\')">' +
        '<div class="title text-primary font-medium">' + esc(r.description) + '</div>' +
        '<div class="meta wh-flex-wrap text-xs text-muted mt-2">' + domainBadge(r.domain) + '<span>' + timeAgo(r.created_at) + '</span></div></div>';
    }
    if (listResult.total > limit) {
      var remaining = listResult.total - limit;
      html += '<button class="wh-show-more" onclick="toggleUnencodedList(this)" data-expanded="false">' + remaining + ' more unencoded rejections</button>';
    }
    el.innerHTML = html;
    el._allItems = items;
    el._total = listResult.total;
  }

  _toggleUnencodedList(btn) {
    var el = document.getElementById('unencoded-list');
    var items = el._allItems;
    var expanded = btn.getAttribute('data-expanded') === 'true';
    var visible = expanded ? items.slice(0, 10) : items;
    var html = '';
    for (var i = 0; i < visible.length; i++) {
      var r = visible[i];
      html += '<div class="wh-list-item clickable" onclick="openRejection(\\'' + esc(r.id) + '\\')">' +
        '<div class="title text-primary font-medium">' + esc(r.description) + '</div>' +
        '<div class="meta wh-flex-wrap text-xs text-muted mt-2">' + domainBadge(r.domain) + '<span>' + timeAgo(r.created_at) + '</span></div></div>';
    }
    var remaining = el._total - (expanded ? 10 : items.length);
    if (expanded) {
      html += '<button class="wh-show-more" onclick="toggleUnencodedList(this)" data-expanded="false">' + (el._total - 10) + ' more unencoded rejections</button>';
    } else if (remaining > 0) {
      html += '<div class="wh-empty">' + remaining + ' more not loaded</div>';
    }
    if (!expanded && items.length >= el._total) {
      html += '<button class="wh-show-more" onclick="toggleUnencodedList(this)" data-expanded="true">Show less</button>';
    }
    el.innerHTML = html;
    el._allItems = items;
  }

  _renderRecentlyEncoded(s) {
    var el = document.getElementById('recently-encoded-list');
    var items = s.recently_encoded || [];
    if (items.length === 0) {
      el.innerHTML = '<div class="wh-empty">No encoded rejections yet</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var r = items[i];
      html += '<div class="wh-list-item clickable" onclick="openRejection(\\'' + esc(r.id) + '\\')">' +
        '<div class="title text-primary font-medium">' + esc(r.description) + '</div>' +
        '<div class="meta wh-flex-wrap text-xs text-muted mt-2">' + domainBadge(r.domain) +
        '<span>' + timeAgo(r.created_at) + '</span></div></div>';
    }
    el.innerHTML = html;
  }

  _renderPatterns(patternsData) {
    var el = document.getElementById('patterns-list');
    if (!patternsData || patternsData.length === 0) {
      el.innerHTML = '<div class="wh-empty">No recurring patterns detected right now. Patterns appear when similar rejections accumulate without being encoded as constraints.</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < Math.min(patternsData.length, 5); i++) {
      var p = patternsData[i];

      // Velocity badge
      var velocityHtml = '';
      if (p.velocity >= 3) velocityHtml = '<span class="text-[11px] font-mono font-semibold text-red ml-2">\\u26A1 accelerating rapidly</span>';
      else if (p.velocity >= 1.5) velocityHtml = '<span class="text-[11px] font-mono font-semibold text-yellow ml-2">\\u2191 accelerating</span>';
      else if (p.velocity <= 0.5 && p.velocity > 0) velocityHtml = '<span class="text-[11px] font-mono text-muted ml-2">\\u2193 decelerating</span>';

      html += '<div class="p-5 bg-gradient-to-r from-glow-orange to-transparent rounded-lg mb-4 border border-edge border-l-[3px] border-l-orange">' +
        '<div class="flex justify-between items-center mb-3">' +
        domainBadge(p.domain) +
        '<span class="font-mono text-xs text-orange font-semibold">' + p.count + ' similar rejections' + velocityHtml + '</span>' +
        '</div>' +
        '<div class="text-xs font-mono text-muted mb-2">Keywords: ' + esc(p.theme) + '</div>' +
        '<div class="pattern-examples text-[13px] text-primary leading-normal">';
      for (var j = 0; j < Math.min(p.descriptions.length, 3); j++) {
        html += '<div class="py-1">' + esc(p.descriptions[j]) + '</div>';
      }
      if (p.descriptions.length > 3) {
        html += '<div class="text-muted italic py-1">+' + (p.descriptions.length - 3) + ' more</div>';
      }
      html += '</div>';

      // Leaky constraint warning
      if (p.leaky_constraint_id) {
        html += '<div class="mt-3 pt-3 border-t border-edge text-[12px] text-yellow">' +
          '\\u26A0 Leaky constraint: <span class="font-medium text-primary">' + esc(p.leaky_constraint_title || '') + '</span>' +
          ' <span class="font-mono text-muted">(' + esc(p.leaky_constraint_id) + ')</span></div>';
      }

      // Suggested constraint draft
      if (p.suggested_constraint) {
        var sc = p.suggested_constraint;
        html += '<div class="mt-3 pt-3 border-t border-edge">' +
          '<div class="text-[11px] font-mono text-accent mb-2">Suggested constraint:</div>' +
          '<div class="text-[13px] text-primary font-medium">' + esc(sc.title) + '</div>' +
          '<div class="text-[12px] text-muted mt-1 leading-normal">' + esc(sc.rule) + '</div>' +
          '<div class="flex gap-3 mt-2">' +
            '<span class="wh-badge">' + esc(sc.category) + '</span>' +
            severityBadge(sc.severity) +
          '</div>' +
        '</div>';
      }

      html += '</div>';
    }
    el.innerHTML = html;
  }

  _renderGraduation(s) {
    var section = document.getElementById('graduation-section');
    var el = document.getElementById('graduation-list');
    var items = s.graduation_candidates || [];
    if (items.length === 0) {
      section.style.display = 'none';
      this._updateGapsGraduationWrapper();
      return;
    }
    section.style.display = '';
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var c = items[i];
      html += '<div class="wh-list-item clickable" onclick="openConstraint(\\'' + esc(c.id) + '\\')">' +
        '<div class="title text-primary font-medium">' + esc(c.title) + '</div>' +
        '<div class="text-[13px] text-muted mt-2 pl-2 border-l-2 border-l-green leading-snug">' + esc(c.rule) + '</div>' +
        '<div class="meta wh-flex-wrap text-xs text-muted mt-2">' + domainBadge(c.domain) + severityBadge(c.severity) +
        '<span class="text-green">Applied ' + c.times_applied + 'x</span></div></div>';
    }
    el.innerHTML = html;
    this._updateGapsGraduationWrapper();
  }

  _updateGapsGraduationWrapper() {
    var wrapper = document.getElementById('gaps-graduation-section');
    var gaps = document.getElementById('domain-gaps-section');
    var grad = document.getElementById('graduation-section');
    var gapsHidden = gaps.style.display === 'none';
    var gradHidden = grad.style.display === 'none';
    if (gapsHidden && gradHidden) {
      wrapper.style.display = 'none';
    } else {
      wrapper.style.display = '';
      wrapper.className = (gapsHidden || gradHidden)
        ? 'grid grid-cols-1 gap-4'
        : 'grid grid-cols-1 lg:grid-cols-2 gap-4';
    }
  }

  _updateDeadElevationWrapper() {
    var wrapper = document.getElementById('dead-elevation-section');
    var dead = document.getElementById('dead-section');
    var deadHidden = dead.style.display === 'none';
    wrapper.className = deadHidden
      ? 'grid grid-cols-1 gap-4'
      : 'grid grid-cols-1 lg:grid-cols-2 gap-4';
  }

  _renderDomainGaps(s) {
    var section = document.getElementById('domain-gaps-section');
    var el = document.getElementById('domain-gaps-list');
    var items = s.domain_gaps || [];
    if (items.length === 0) {
      section.style.display = 'none';
      this._updateGapsGraduationWrapper();
      return;
    }
    section.style.display = '';
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var d = items[i];
      var gapPct = 100 - d.coverage_pct;
      html += '<div class="flex items-center gap-3 py-3 border-b border-edge last:border-b-0 bar-row-click" data-gap-domain="' + esc(d.domain) + '">' +
        '<div class="w-[120px] font-mono text-[13px] text-primary shrink-0">' + esc(d.domain) + '</div>' +
        '<div class="flex-1 h-2 bg-raised rounded overflow-hidden">' +
          '<div class="gap-bar-fill h-full bg-red rounded" style="width:' + gapPct + '%"></div>' +
        '</div>' +
        '<div class="text-xs font-mono text-muted whitespace-nowrap">' + d.unencoded + ' unencoded / ' + d.coverage_pct + '% covered</div>' +
        '</div>';
    }
    el.innerHTML = html;
    // Attach click handlers to gap rows
    var gapRows = el.querySelectorAll('[data-gap-domain]');
    for (var k = 0; k < gapRows.length; k++) {
      (function(row) {
        row.addEventListener('click', function() {
          navigateWithFilters('rejections', { domain: row.getAttribute('data-gap-domain'), encoded: 'no' });
        });
      })(gapRows[k]);
    }
    this._updateGapsGraduationWrapper();
  }

  _renderDead(s) {
    var section = document.getElementById('dead-section');
    var el = document.getElementById('dead-list');
    var items = s.dead_constraints || [];
    if (items.length === 0) {
      section.style.display = 'none';
      this._updateDeadElevationWrapper();
      return;
    }
    section.style.display = '';
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var c = items[i];
      html += renderConstraintDetail(c, '<span class="text-green">Applied ' + c.times_applied + 'x \\u00B7 last ' + timeAgo(c.last_applied_at) + '</span>');
    }
    el.innerHTML = html;
    this._updateDeadElevationWrapper();
  }

  _renderElevation(s) {
    var el = document.getElementById('elevation-list');
    var items = s.elevation_candidates || [];
    if (items.length === 0) {
      el.innerHTML = '<div class="wh-empty">No elevation candidates</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var c = items[i];
      html += renderConstraintDetail(c, '<span class="text-green">Applied ' + c.times_applied + 'x</span>');
    }
    el.innerHTML = html;
  }
}
customElements.define('whet-overview', WhetOverview);
`;
