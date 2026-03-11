import { getDb } from "../db/connection.js";
import type { Constraint } from "../lib/types.js";

export interface ExportInput {
  domain?: string;
  format?: "markdown" | "json";
}

export function exportConstraints(input: ExportInput): string {
  const db = getDb();
  const format = input.format ?? "markdown";

  const conditions: string[] = ["status = 'active'"];
  const params: unknown[] = [];

  if (input.domain) {
    conditions.push("domain = ?");
    params.push(input.domain);
  }

  const constraints = db.prepare(
    `SELECT * FROM constraints WHERE ${conditions.join(" AND ")} ORDER BY domain, severity ASC, title`
  ).all(...params) as unknown as Constraint[];

  if (format === "json") {
    return JSON.stringify(constraints, null, 2);
  }

  return formatMarkdown(constraints);
}

function formatMarkdown(constraints: Constraint[]): string {
  if (constraints.length === 0) {
    return "# Whetstone Constraints\n\nNo active constraints.\n";
  }

  const lines: string[] = ["# Whetstone Constraints", ""];

  // Group by domain
  const byDomain = new Map<string, Constraint[]>();
  for (const c of constraints) {
    const group = byDomain.get(c.domain) ?? [];
    group.push(c);
    byDomain.set(c.domain, group);
  }

  for (const [domain, domainConstraints] of byDomain) {
    lines.push(`## ${domain}`, "");

    for (const c of domainConstraints) {
      lines.push(`### ${c.title}`);
      lines.push("");
      lines.push(`**Severity:** ${c.severity} | **Category:** ${c.category} | **Applied:** ${c.times_applied} times`);
      lines.push("");
      lines.push(`**Rule:** ${c.rule}`);

      if (c.reasoning) {
        lines.push("");
        lines.push(`**Why:** ${c.reasoning}`);
      }

      if (c.rejected_example) {
        lines.push("");
        lines.push("**Bad:**");
        lines.push("```");
        lines.push(c.rejected_example);
        lines.push("```");
      }

      if (c.accepted_example) {
        lines.push("");
        lines.push("**Good:**");
        lines.push("```");
        lines.push(c.accepted_example);
        lines.push("```");
      }

      if (c.tags) {
        try {
          const tags = JSON.parse(c.tags) as string[];
          if (tags.length > 0) {
            lines.push("");
            lines.push(`**Tags:** ${tags.join(", ")}`);
          }
        } catch { /* ignore malformed tags */ }
      }

      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}
