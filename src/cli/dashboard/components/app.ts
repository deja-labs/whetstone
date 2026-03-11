// <whet-app> — Top-level application shell.
// Owns routing, auto-refresh timer, and page switching.
// Renders <whet-nav> + page containers + modal overlay.
// Exposes global functions for backward compat with onclick handlers.

export const APP = `
class WhetApp extends WhetBase {
  connectedCallback() {
    super.connectedCallback();
    this.currentPage = 'overview';
    this._autoRefresh = true;
    this._refreshTimer = null;

    // Render the shell DOM (one-time setup)
    this.innerHTML = document.getElementById('app-template').innerHTML;

    // Wire up nav events
    var nav = this.querySelector('whet-nav');
    var self = this;
    nav.addEventListener('page-change', function(e) { self.switchPage(e.detail); });
    nav.addEventListener('manual-refresh', function() { self.refresh(); });
    nav.addEventListener('toggle-refresh', function() { self.toggleAuto(); });

    // Expose globally for onclick handlers still in vanilla JS
    window.app = self;
    window.switchPage = function(p) { self.switchPage(p); };
    window.refresh = function() { self.refresh(); };
    window.toggleAuto = function() { self.toggleAuto(); };

    // Hash routing
    if (window.location.hash === '#constraints') {
      this.switchPage('constraints');
    } else if (window.location.hash === '#rejections') {
      this.switchPage('rejections');
    } else {
      this.refresh();
    }
    this.startAutoRefresh();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._refreshTimer) clearInterval(this._refreshTimer);
  }

  switchPage(page) {
    this.currentPage = page;
    this.querySelector('#page-overview').style.display = page === 'overview' ? '' : 'none';
    this.querySelector('#page-rejections').style.display = page === 'rejections' ? '' : 'none';
    this.querySelector('#page-constraints').style.display = page === 'constraints' ? '' : 'none';

    // Update nav
    var nav = this.querySelector('whet-nav');
    nav.currentPage = page;

    window.location.hash = page === 'overview' ? '' : page;
    if (page === 'constraints') loadConstraintsPage();
    if (page === 'rejections') loadRejectionsPage();
  }

  async refresh() {
    var nav = this.querySelector('whet-nav');
    nav.status = 'Refreshing...';
    try {
      if (this.currentPage === 'overview') {
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
      } else if (this.currentPage === 'rejections') {
        await loadRejectionsPage();
      } else if (this.currentPage === 'constraints') {
        await loadConstraintsPage();
      }
      nav.status = 'Updated ' + new Date().toLocaleTimeString();
    } catch (err) {
      nav.status = 'Error: ' + err.message;
    }
  }

  toggleAuto() {
    this._autoRefresh = !this._autoRefresh;
    var nav = this.querySelector('whet-nav');
    nav.autoRefresh = this._autoRefresh;
    if (this._autoRefresh) {
      this.startAutoRefresh();
    } else {
      if (this._refreshTimer) { clearInterval(this._refreshTimer); this._refreshTimer = null; }
    }
  }

  startAutoRefresh() {
    var self = this;
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    this._refreshTimer = setInterval(function() { self.refresh(); }, 10000);
  }
}
customElements.define('whet-app', WhetApp);
`;
