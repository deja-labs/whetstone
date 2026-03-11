import { getDb } from "../db/connection.js";
import type { Constraint, ConstraintStatus, Severity } from "../lib/types.js";

export interface UpdateConstraintInput {
  id: string;
  title?: string;
  rule?: string;
  reasoning?: string;
  rejected_example?: string;
  accepted_example?: string;
  tags?: string[];
  severity?: Severity;
  status?: ConstraintStatus;
  superseded_by?: string;
}

export function updateConstraint(input: UpdateConstraintInput): Constraint {
  const db = getDb();
  const now = new Date().toISOString();

  const existing = db.prepare("SELECT * FROM constraints WHERE id = ?").get(input.id) as unknown as Constraint | undefined;
  if (!existing) {
    throw new Error(`Constraint not found: ${input.id}`);
  }

  const updates: string[] = ["updated_at = ?"];
  const params: unknown[] = [now];

  if (input.title !== undefined) { updates.push("title = ?"); params.push(input.title); }
  if (input.rule !== undefined) { updates.push("rule = ?"); params.push(input.rule); }
  if (input.reasoning !== undefined) { updates.push("reasoning = ?"); params.push(input.reasoning); }
  if (input.rejected_example !== undefined) { updates.push("rejected_example = ?"); params.push(input.rejected_example); }
  if (input.accepted_example !== undefined) { updates.push("accepted_example = ?"); params.push(input.accepted_example); }
  if (input.tags !== undefined) { updates.push("tags = ?"); params.push(JSON.stringify(input.tags)); }
  if (input.severity !== undefined) { updates.push("severity = ?"); params.push(input.severity); }
  if (input.status !== undefined) { updates.push("status = ?"); params.push(input.status); }

  params.push(input.id);

  db.prepare(`UPDATE constraints SET ${updates.join(", ")} WHERE id = ?`).run(...params);

  return db.prepare("SELECT * FROM constraints WHERE id = ?").get(input.id) as unknown as Constraint;
}
