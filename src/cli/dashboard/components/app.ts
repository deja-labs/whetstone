// <whet-app> — Top-level application shell.
// Owns routing, WebSocket connection, and page switching.
// Renders <whet-nav> + page components + modal overlay.
// Delegates data fetching to page components via load().
// Exposes global functions for backward compat with onclick handlers.

export const APP = `
class WhetApp extends WhetBase {
  connectedCallback() {
    super.connectedCallback();
    this.currentPage = 'overview';
    this._refreshTimer = null;
    this._ws = null;

    // Render the shell DOM (one-time setup)
    this.innerHTML = document.getElementById('app-template').innerHTML;

    // Wire up nav events
    var nav = this.querySelector('whet-nav');
    var self = this;
    nav.addEventListener('page-change', function(e) { self.switchPage(e.detail); });
    nav.addEventListener('manual-refresh', function() { self.refresh(); });

    // Expose globally for onclick handlers still in vanilla JS
    window.app = self;
    window.switchPage = function(p) { self.switchPage(p); };
    window.refresh = function() { self.refresh(); };

    // Path routing
    var path = window.location.pathname;
    if (path === '/constraints') {
      this.switchPage('constraints', true);
    } else if (path === '/rejections') {
      this.switchPage('rejections', true);
    } else {
      this.refresh();
    }

    // Handle browser back/forward
    window.addEventListener('popstate', function() {
      var p = window.location.pathname;
      var page = p === '/rejections' ? 'rejections' : p === '/constraints' ? 'constraints' : 'overview';
      self.switchPage(page, true);
    });
    this._connectWs();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    if (this._ws) { this._ws.close(); this._ws = null; }
  }

  _connectWs() {
    var self = this;
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var ws = new WebSocket(proto + '//' + location.host + '/ws');
    self._ws = ws;

    ws.onopen = function() {
      if (self._refreshTimer) { clearInterval(self._refreshTimer); self._refreshTimer = null; }
      var nav = self.querySelector('whet-nav');
      if (nav) nav.status = 'Live';
    };

    ws.onmessage = function(evt) {
      try {
        var msg = JSON.parse(evt.data);
        if (msg.type === 'refresh') {
          self.refresh();
        }
      } catch(e) {}
    };

    ws.onclose = function() {
      self._ws = null;
      var nav = self.querySelector('whet-nav');
      if (nav) nav.status = 'Offline';
      // Fall back to polling
      if (!self._refreshTimer) {
        self._refreshTimer = setInterval(function() { self.refresh(); }, 10000);
      }
      // Reconnect after delay
      setTimeout(function() { self._connectWs(); }, 3000);
    };

    ws.onerror = function() { ws.close(); };
  }

  switchPage(page, skipPush) {
    this.currentPage = page;
    this.querySelector('#page-overview').style.display = page === 'overview' ? '' : 'none';
    this.querySelector('#page-rejections').style.display = page === 'rejections' ? '' : 'none';
    this.querySelector('#page-constraints').style.display = page === 'constraints' ? '' : 'none';

    // Update nav
    var nav = this.querySelector('whet-nav');
    nav.currentPage = page;

    if (!skipPush) {
      var url = page === 'overview' ? '/' : '/' + page;
      window.history.pushState({ page: page }, '', url);
    }

    // Delegate to page component
    var pageEl = this.querySelector('#page-' + page);
    if (pageEl && pageEl.load) pageEl.load();
  }

  async refresh() {
    try {
      var pageEl = this.querySelector('#page-' + this.currentPage);
      if (pageEl && pageEl.load) {
        await pageEl.load();
      }
      var nav = this.querySelector('whet-nav');
      nav.status = (this._ws && this._ws.readyState === WebSocket.OPEN) ? 'Live' : 'Offline';
    } catch (err) {
      var nav = this.querySelector('whet-nav');
      nav.status = 'Offline';
    }
  }
}
customElements.define('whet-app', WhetApp);
`;
