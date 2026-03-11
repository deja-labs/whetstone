import { getDb } from "../db/connection.js";

export interface LinkInput {
  constraint_id: string;
  rejection_ids: string[];
}

export interface LinkResult {
  constraint_id: string;
  linked_count: number;
}

export function link(input: LinkInput): LinkResult {
  const db = getDb();

  // Verify constraint exists
  const constraint = db.prepare("SELECT id, status FROM constraints WHERE id = ?").get(input.constraint_id) as { id: string; status: string } | undefined;
  if (!constraint) {
    throw new Error(`Constraint not found: ${input.constraint_id}`);
  }

  // Link each rejection to the constraint
  const stmt = db.prepare("UPDATE rejections SET constraint_id = ? WHERE id = ?");
  let linked = 0;
  for (const rejectionId of input.rejection_ids) {
    const result = stmt.run(input.constraint_id, rejectionId);
    if (result.changes > 0) {
      linked++;
    }
  }

  return {
    constraint_id: input.constraint_id,
    linked_count: linked,
  };
}
