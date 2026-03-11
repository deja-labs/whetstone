import { getDb } from "../db/connection.js";
import type { Rejection } from "../lib/types.js";

export interface ListInput {
  domain?: string;
  status?: "encoded" | "unencoded" | "all";
  limit?: number;
}

export interface ListResult {
  rejections: Rejection[];
  total: number;
}

export function list(input: ListInput): ListResult {
  const db = getDb();
  const status = input.status ?? "all";
  const limit = input.limit ?? 50;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (input.domain) {
    conditions.push("domain = ?");
    params.push(input.domain);
  }

  if (status === "encoded") {
    conditions.push("constraint_id IS NOT NULL");
  } else if (status === "unencoded") {
    conditions.push("constraint_id IS NULL");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM rejections ${where}`).get(...params) as
    | { total: number }
    | undefined;
  const total = countRow?.total ?? 0;

  const rejections = db.prepare(
    `SELECT * FROM rejections ${where} ORDER BY created_at DESC LIMIT ?`,
  ).all(...params, limit) as unknown as Rejection[];

  return { rejections, total };
}
