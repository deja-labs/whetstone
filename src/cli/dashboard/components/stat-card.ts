// <whet-stat-card> — Reusable stat card component.
// Attributes: value, label, delta (optional), value-class (optional: good/warn), value-color (optional inline color)

export const STAT_CARD = `
class WhetStatCard extends WhetBase {
  static get properties() {
    return {
      value: { type: String },
      label: { type: String },
      delta: { type: String },
    };
  }

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.delta = '';
  }

  updated() {
    this.className = 'bg-card border border-edge rounded-lg p-6 block transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.15)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:border-edge-hover';
  }

  render() {
    var colorStyle = this.getAttribute('value-color');
    var vc = this.getAttribute('value-class') || '';
    var styleAttr = colorStyle ? ' style="color:' + colorStyle + '"' : '';
    var valClass = 'text-3xl font-bold font-mono leading-none tracking-tight';
    if (vc === 'warn') valClass += ' text-yellow';
    if (vc === 'good') valClass += ' text-green';
    var h = '<div class="' + valClass + '"' + styleAttr + '>' + esc(this.value) + '</div>';
    h += '<div class="text-xs text-muted uppercase tracking-wide mt-2">' + esc(this.label) + '</div>';
    if (this.delta) {
      var n = parseFloat(this.delta);
      var deltaClass = 'text-[11px] font-mono mt-2.5';
      if (n > 0) deltaClass += ' text-green';
      else if (n < 0) deltaClass += ' text-red';
      else deltaClass += ' text-muted';
      h += '<div class="' + deltaClass + '">' + esc(this.delta) + '</div>';
    }
    this.innerHTML = h;
  }
}
customElements.define('whet-stat-card', WhetStatCard);
`;
