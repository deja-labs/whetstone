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
    header.className = 'flex items-center justify-between mb-8 pb-5 border-b border-edge';

    // Logo
    var h1 = document.createElement('h1');
    h1.className = 'text-lg font-bold text-primary tracking-tight';
    h1.innerHTML = 'Whetstone <span class="text-muted font-normal text-xs ml-2 uppercase tracking-widest">Dashboard</span>';
    header.appendChild(h1);

    // Nav tabs
    var nav = document.createElement('nav');
    nav.className = 'flex gap-3';
    for (var i = 0; i < pages.length; i++) {
      (function(page) {
        var btn = document.createElement('button');
        var isActive = page === self.currentPage;
        btn.className = 'border-none py-2 px-4 text-[13px] cursor-pointer transition-all duration-150 rounded-md ' +
          (isActive ? 'text-accent bg-glow-accent font-semibold' : 'text-muted bg-transparent hover:text-primary hover:bg-raised');
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
    controls.className = 'flex items-center gap-3';

    var statusSpan = document.createElement('span');
    statusSpan.className = 'text-xs text-muted font-mono';
    statusSpan.textContent = this.status;
    controls.appendChild(statusSpan);

    var refreshBtn = document.createElement('button');
    refreshBtn.className = 'bg-raised text-primary border border-edge rounded-md py-2 px-3 text-xs cursor-pointer font-sans hover:bg-card hover:border-edge-hover transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent/30';
    refreshBtn.textContent = 'Refresh';
    refreshBtn.addEventListener('click', function() {
      self.dispatchEvent(new CustomEvent('manual-refresh', { bubbles: true }));
    });
    controls.appendChild(refreshBtn);

    var autoBtn = document.createElement('button');
    autoBtn.textContent = 'Auto: ' + (this.autoRefresh ? 'ON' : 'OFF');
    autoBtn.className = 'bg-raised text-primary border border-edge rounded-md py-2 px-3 text-xs cursor-pointer font-sans hover:bg-card hover:border-edge-hover transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-accent/30' +
      (this.autoRefresh ? ' !border-accent !text-accent !bg-glow-accent' : '');
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
