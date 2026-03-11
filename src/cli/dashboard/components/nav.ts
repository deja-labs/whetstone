// <whet-nav> — Header navigation with tabs, status, and refresh controls.
// Dispatches events: page-change, manual-refresh, toggle-refresh

export const NAV = `
class WhetNav extends WhetBase {
  static get properties() {
    return {
      currentPage: { type: String, attribute: 'current-page' },
      status: { type: String },
      autoRefresh: { type: Boolean, attribute: 'auto-refresh' },
    };
  }

  constructor() {
    super();
    this.currentPage = 'overview';
    this.status = 'Loading...';
    this.autoRefresh = true;
  }

  updated() {
    this.className = '';
  }

  render() {
    var pages = ['overview', 'rejections', 'constraints'];
    var self = this;
    this.innerHTML = '';

    var header = document.createElement('header');

    // Logo
    var h1 = document.createElement('h1');
    h1.innerHTML = 'Whetstone <span>Dashboard</span>';
    header.appendChild(h1);

    // Nav tabs
    var nav = document.createElement('nav');
    nav.className = 'nav-tabs';
    for (var i = 0; i < pages.length; i++) {
      (function(page) {
        var btn = document.createElement('button');
        btn.className = 'nav-tab' + (page === self.currentPage ? ' active' : '');
        btn.textContent = page.charAt(0).toUpperCase() + page.slice(1);
        btn.addEventListener('click', function() {
          self.dispatchEvent(new CustomEvent('page-change', { detail: page, bubbles: true }));
        });
        nav.appendChild(btn);
      })(pages[i]);
    }
    header.appendChild(nav);

    // Controls
    var controls = document.createElement('div');
    controls.className = 'header-controls';

    var statusSpan = document.createElement('span');
    statusSpan.textContent = this.status;
    controls.appendChild(statusSpan);

    var refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh';
    refreshBtn.addEventListener('click', function() {
      self.dispatchEvent(new CustomEvent('manual-refresh', { bubbles: true }));
    });
    controls.appendChild(refreshBtn);

    var autoBtn = document.createElement('button');
    autoBtn.textContent = 'Auto: ' + (this.autoRefresh ? 'ON' : 'OFF');
    autoBtn.className = this.autoRefresh ? 'active' : '';
    autoBtn.addEventListener('click', function() {
      self.dispatchEvent(new CustomEvent('toggle-refresh', { bubbles: true }));
    });
    controls.appendChild(autoBtn);

    header.appendChild(controls);
    this.appendChild(header);
  }
}
customElements.define('whet-nav', WhetNav);
`;
