import type { Constraint, Rejection } from "../lib/types.js";
import type { SearchResult } from "../tools/search.js";
import type { PatternCluster } from "../tools/patterns.js";
import type { StatsResult } from "../tools/stats.js";
import type { ListResult } from "../tools/list.js";

export function formatRejectionResult(rejection: Rejection): string {
  return [
    `Rejection logged: "${rejection.description}" [${rejection.domain}] (${rejection.id})`,
    ``,
    `To encode this as a durable constraint, use the constrain tool with rejection_ids: ["${rejection.id}"]`,
  ].join("\n");
}

export function formatConstraintCreated(constraint: Constraint): string {
  return `Constraint created: "${constraint.title}" [${constraint.domain}/${constraint.category}] severity=${constraint.severity} (${constraint.id})`;
}

export function formatConstraintsList(constraints: Constraint[]): string {
  if (constraints.length === 0) {
    return "No active constraints found.";
  }

  const lines = constraints.map((c) => {
    let line = `${c.id} [${c.severity}] ${c.title}\n  Domain: ${c.domain}\n  Rule: ${c.rule}`;
    if (c.reasoning) line += `\n  Why: ${c.reasoning}`;
    if (c.rejected_example) line += `\n  Bad: ${c.rejected_example}`;
    if (c.accepted_example) line += `\n  Good: ${c.accepted_example}`;
    line += `\n  → To mark as applied: use the applied tool with constraint_id="${c.id}"`;
    return line;
  });

  return `${constraints.length} active constraint(s):\n\n${lines.join("\n\n")}`;
}

export function formatSearchResults(results: SearchResult, query: string): string {
  const parts: string[] = [];

  if (results.constraints.length > 0) {
    parts.push(`**${results.constraints.length} constraint(s):**`);
    for (const c of results.constraints) {
      parts.push(`  [${c.severity}] ${c.title} (${c.id})\n    ${c.rule}`);
    }
  }

  if (results.rejections.length > 0) {
    parts.push(`**${results.rejections.length} rejection(s):**`);
    for (const r of results.rejections) {
      parts.push(`  [${r.domain}] ${r.description} (${r.id})`);
    }
  }

  if (parts.length === 0) {
    return `No results for "${query}".`;
  }

  return parts.join("\n\n");
}

export function formatAppliedResult(result: { times_applied: number }): string {
  return `Constraint applied (total: ${result.times_applied} times).`;
}

export function formatLinkResult(result: { linked_count: number; constraint_id: string }): string {
  return `Linked ${result.linked_count} rejection(s) to constraint ${result.constraint_id}.`;
}

export function formatUpdateResult(constraint: Constraint): string {
  return `Constraint updated: "${constraint.title}" [status=${constraint.status}, severity=${constraint.severity}] (${constraint.id})`;
}

export function formatPatternsResult(patterns: PatternCluster[]): string {
  if (patterns.length === 0) {
    return "No recurring patterns found in unencoded rejections.";
  }

  const lines = patterns.map((p) => {
    const descs = p.descriptions.map((d) => `    - ${d}`).join("\n");
    const ids = p.rejection_ids.join(", ");

    // Velocity indicator
    let velocityLabel = "";
    if (p.velocity >= 3) velocityLabel = " accelerating rapidly";
    else if (p.velocity >= 1.5) velocityLabel = " accelerating";
    else if (p.velocity <= 0.5) velocityLabel = " decelerating";

    // Leaky constraint indicator
    let leakyLabel = "";
    if (p.leaky_constraint_id) {
      leakyLabel = `\n    Leaky constraint: "${p.leaky_constraint_title}" (${p.leaky_constraint_id})`;
    }

    // Suggested constraint draft
    let draftLabel = "";
    if (p.suggested_constraint) {
      const sc = p.suggested_constraint;
      draftLabel = `\n    Suggested constraint:\n      Title: ${sc.title}\n      Rule: ${sc.rule}\n      Category: ${sc.category} | Severity: ${sc.severity}`;
    }

    return `**${p.domain}** — "${p.theme}" (${p.count} rejections, velocity: ${p.velocity}${velocityLabel}):\n${descs}\n    IDs: ${ids}${leakyLabel}${draftLabel}`;
  });

  return `Recurring rejection patterns (sorted by urgency):\n\n${lines.join("\n\n")}`;
}

export function formatStatsResult(s: StatsResult): string {
  const lines = [
    `**Rejections:** ${s.total_rejections} total, ${s.unencoded_rejections} unencoded`,
    `**Constraints:** ${s.total_constraints} total, ${s.active_constraints} active`,
  ];

  if (s.rejections_by_domain.length > 0) {
    lines.push("");
    lines.push("**Rejections by domain:**");
    for (const r of s.rejections_by_domain) {
      lines.push(`  ${r.domain}: ${r.count}`);
    }
  }

  if (s.most_applied.length > 0) {
    lines.push("");
    lines.push("**Most applied constraints:**");
    for (const c of s.most_applied) {
      lines.push(`  ${c.title} [${c.domain}]: ${c.times_applied} times`);
    }
  }

  if (s.stale_constraints.length > 0) {
    lines.push("");
    lines.push("**Stale constraints** (active, never applied, >30 days old — consider deprecating):");
    for (const c of s.stale_constraints) {
      lines.push(`  ${c.title} [${c.domain}] severity=${c.severity} created=${c.created_at.slice(0, 10)}`);
    }
  }

  if (s.elevation_candidates.length > 0) {
    lines.push("");
    lines.push("**Consider elevating to critical** (high usage, not yet critical):");
    for (const c of s.elevation_candidates) {
      lines.push(`  ${c.title} [${c.domain}] severity=${c.severity} applied=${c.times_applied} times`);
    }
  }

  return lines.join("\n");
}

export function formatListResult(result: ListResult): string {
  if (result.rejections.length === 0) {
    return "No rejections found.";
  }

  const lines = result.rejections.map((r) => {
    const encoded = r.constraint_id ? ` → encoded (${r.constraint_id})` : " [unencoded]";
    let line = `[${r.domain}] ${r.description}${encoded} (${r.id})`;
    if (r.reasoning) line += `\n  Why: ${r.reasoning}`;
    return line;
  });

  const showing = result.rejections.length < result.total
    ? ` (showing ${result.rejections.length} of ${result.total})`
    : "";

  return `${result.total} rejection(s)${showing}:\n\n${lines.join("\n\n")}`;
}
