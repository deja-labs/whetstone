import { getDb } from "../db/connection.js";
import { generateId } from "../lib/ulid.js";
import type { Constraint, ConstraintCategory, Severity } from "../lib/types.js";

export interface ConstrainInput {
  domain: string;
  category: ConstraintCategory;
  title: string;
  rule: string;
  reasoning?: string;
  rejected_example?: string;
  accepted_example?: string;
  tags?: string[];
  severity?: Severity;
  source?: string;
  rejection_ids?: string[];
}

export function constrain(input: ConstrainInput): Constraint {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();
  const severity = input.severity ?? "important";
  const tags = input.tags ? JSON.stringify(input.tags) : null;

  const stmt = db.prepare(`
    INSERT INTO constraints (
      id, domain, category, title, rule, reasoning,
      rejected_example, accepted_example, tags, severity,
      status, source, times_applied, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 0, ?, ?)
  `);

  stmt.run(
    id,
    input.domain,
    input.category,
    input.title,
    input.rule,
    input.reasoning ?? null,
    input.rejected_example ?? null,
    input.accepted_example ?? null,
    tags,
    severity,
    input.source ?? null,
    now,
    now,
  );

  // Link rejections to this constraint
  if (input.rejection_ids && input.rejection_ids.length > 0) {
    const linkStmt = db.prepare("UPDATE rejections SET constraint_id = ? WHERE id = ?");
    for (const rejectionId of input.rejection_ids) {
      linkStmt.run(id, rejectionId);
    }
  }

  return {
    id,
    domain: input.domain,
    category: input.category,
    title: input.title,
    rule: input.rule,
    reasoning: input.reasoning ?? null,
    rejected_example: input.rejected_example ?? null,
    accepted_example: input.accepted_example ?? null,
    tags,
    severity,
    status: "active",
    source: input.source ?? null,
    times_applied: 0,
    last_applied_at: null,
    created_at: now,
    updated_at: now,
  };
}
