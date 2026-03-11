import { getDb } from "../db/connection.js";
import { generateId } from "../lib/ulid.js";
import type { Rejection } from "../lib/types.js";

export interface RejectInput {
  domain: string;
  description: string;
  reasoning?: string;
  raw_output?: string;
}

export function reject(input: RejectInput): Rejection {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO rejections (id, domain, description, reasoning, raw_output, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, input.domain, input.description, input.reasoning ?? null, input.raw_output ?? null, now);

  return {
    id,
    domain: input.domain,
    description: input.description,
    reasoning: input.reasoning ?? null,
    raw_output: input.raw_output ?? null,
    constraint_id: null,
    created_at: now,
  };
}
