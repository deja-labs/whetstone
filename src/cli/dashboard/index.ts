// Dashboard HTML assembly.
// Injects Lit CDN + web component definitions into the legacy HTML.

import { getDashboardHtml as getLegacyHtml } from "../dashboard-html.js";
import { BASE_COMPONENT } from "./components/base.js";
import { STAT_CARD } from "./components/stat-card.js";
import { BADGE } from "./components/badge.js";
import { NAV } from "./components/nav.js";
import { APP } from "./components/app.js";

const LIT_CDN = "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

const COMPONENT_SCRIPT = `<script type="module">
import { LitElement, html, css } from '${LIT_CDN}';

${BASE_COMPONENT}
${STAT_CARD}
${BADGE}
${NAV}
${APP}
</script>`;

export function getDashboardHtml(version: string): string {
  const legacy = getLegacyHtml(version);
  // Inject component definitions before </head> so they're defined before body renders
  return legacy.replace("</head>", COMPONENT_SCRIPT + "\n</head>");
}
