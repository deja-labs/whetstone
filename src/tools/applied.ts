import { getDb } from "../db/connection.js";

export interface AppliedInput {
  constraint_id: string;
}

export function applied(input: AppliedInput): { success: boolean; times_applied: number } {
  const db = getDb();
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE constraints
    SET times_applied = times_applied + 1, last_applied_at = ?
    WHERE id = ? AND status = 'active'
  `).run(now, input.constraint_id);

  if (result.changes === 0) {
    throw new Error(`Constraint not found or not active: ${input.constraint_id}`);
  }

  const row = db.prepare("SELECT times_applied FROM constraints WHERE id = ?").get(input.constraint_id) as { times_applied: number };

  return { success: true, times_applied: row.times_applied };
}
