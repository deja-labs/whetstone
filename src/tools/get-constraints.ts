import { getDb } from "../db/connection.js";
import type { Constraint } from "../lib/types.js";

export interface GetConstraintsInput {
  domain?: string;
  severity?: string;
}

export function getConstraints(input: GetConstraintsInput): Constraint[] {
  const db = getDb();

  const conditions: string[] = ["status = 'active'"];
  const params: unknown[] = [];

  if (input.domain) {
    conditions.push("domain = ?");
    params.push(input.domain);
  }

  if (input.severity) {
    const levels = severityAtOrAbove(input.severity);
    conditions.push(`severity IN (${levels.map(() => "?").join(", ")})`);
    params.push(...levels);
  }

  const sql = `SELECT * FROM constraints WHERE ${conditions.join(" AND ")} ORDER BY times_applied DESC, severity ASC, created_at DESC`;

  return db.prepare(sql).all(...params) as unknown as Constraint[];
}

function severityAtOrAbove(level: string): string[] {
  switch (level) {
    case "critical":
      return ["critical"];
    case "important":
      return ["critical", "important"];
    case "preference":
      return ["critical", "important", "preference"];
    default:
      return ["critical", "important", "preference"];
  }
}
