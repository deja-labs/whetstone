// <whet-nav> — Header navigation with tabs and connection status.
// Dispatches events: page-change, manual-refresh
// Responsive: collapses to hamburger menu below md (768px).

import { LOGO_SVG_INLINE } from "../favicon.js";

export const NAV = `
class WhetNav extends WhetBase {
  static get properties() {
    return {
      currentPage: { type: String, attribute: 'current-page' },
      status: { type: String },
    };
  }

  constructor() {
    super();
    this.currentPage = 'overview';
    this.status = 'Loading...';
    this._menuOpen = false;
  }

  render() {
    var pages = ['overview', 'rejections', 'constraints'];
    var self = this;
    this.innerHTML = '';
    this.className = 'block mb-4';

    // ── Header row ──────────────────────────────────────────────────
    // Desktop (md+): 3-column grid  — logo | tabs | controls
    // Mobile (<md):  flex row        — logo | status + hamburger
    var header = document.createElement('header');
    header.className = 'flex items-center justify-between md:grid md:grid-cols-3 border-b border-edge py-4';

    // Logo
    var h1 = document.createElement('h1');
    h1.className = 'text-lg font-bold text-primary tracking-tight flex items-center gap-2';
    h1.innerHTML = '<span class="inline-flex items-center gap-2 cursor-pointer" data-nav-home>${LOGO_SVG_INLINE} Whetstone</span> <span class="text-muted font-normal text-xs ml-2 uppercase tracking-widest">Dashboard</span>';
    h1.querySelector('[data-nav-home]').addEventListener('click', function() {
      self.dispatchEvent(new CustomEvent('page-change', { detail: 'overview', bubbles: true }));
    });
    header.appendChild(h1);

    // Nav tabs (hidden on mobile, shown desktop)
    var nav = document.createElement('nav');
    nav.className = 'hidden md:flex gap-3 justify-center';
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

    // Controls (hidden on mobile, shown desktop)
    var controls = document.createElement('div');
    controls.className = 'hidden md:flex items-center gap-3 justify-end';

    controls.appendChild(self._renderStatus());

    header.appendChild(controls);

    // Mobile: status + hamburger (visible only below md)
    var mobileRight = document.createElement('div');
    mobileRight.className = 'flex md:hidden items-center gap-3';

    mobileRight.appendChild(self._renderStatus());

    var hamburger = document.createElement('button');
    hamburger.className = 'border-none bg-transparent text-muted text-2xl cursor-pointer p-1 rounded-md hover:text-primary hover:bg-raised transition-colors leading-none';
    hamburger.innerHTML = this._menuOpen ? '\\u2715' : '\\u2630';
    hamburger.addEventListener('click', function() {
      self._menuOpen = !self._menuOpen;
      self.render();
    });
    mobileRight.appendChild(hamburger);

    header.appendChild(mobileRight);
    this.appendChild(header);

    // ── Mobile dropdown ─────────────────────────────────────────────
    if (this._menuOpen) {
      var dropdown = document.createElement('div');
      dropdown.className = 'md:hidden flex flex-col gap-1 py-3 border-b border-edge';

      for (var j = 0; j < pages.length; j++) {
        (function(page) {
          var btn = document.createElement('button');
          var isActive = page === self.currentPage;
          btn.className = 'border-none w-full text-left py-3 px-4 text-sm cursor-pointer transition-all duration-150 rounded-md ' +
            (isActive ? 'text-accent bg-glow-accent font-semibold' : 'text-muted bg-transparent hover:text-primary hover:bg-raised');
          btn.textContent = page.charAt(0).toUpperCase() + page.slice(1);
          btn.addEventListener('click', function() {
            self._menuOpen = false;
            self.dispatchEvent(new CustomEvent('page-change', { detail: page, bubbles: true }));
          });
          dropdown.appendChild(btn);
        })(pages[j]);
      }

      this.appendChild(dropdown);
    }
  }

  _renderStatus() {
    var isLive = this.status === 'Live';
    var container = document.createElement('span');
    container.className = 'inline-flex items-center gap-1.5 text-xs font-mono cursor-pointer';
    container.addEventListener('click', function() {
      // Manual refresh on click
      this.dispatchEvent(new CustomEvent('manual-refresh', { bubbles: true }));
    }.bind(this));

    var dot = document.createElement('span');
    dot.className = 'inline-block w-2 h-2 rounded-full ' + (isLive ? 'bg-green shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red shadow-[0_0_6px_rgba(239,68,68,0.4)]');
    container.appendChild(dot);

    var text = document.createElement('span');
    text.className = isLive ? 'text-green' : 'text-red';
    text.textContent = isLive ? 'Live' : 'Offline';
    container.appendChild(text);

    return container;
  }
}
customElements.define('whet-nav', WhetNav);
`;
