import { getDb } from "../db/connection.js";
import type { Constraint, Rejection } from "../lib/types.js";

export interface SearchInput {
  query: string;
  type?: "constraints" | "rejections" | "all";
}

export interface SearchResult {
  constraints: Constraint[];
  rejections: Rejection[];
}

export function search(input: SearchInput): SearchResult {
  const db = getDb();
  const searchType = input.type ?? "all";
  const pattern = `%${input.query}%`;

  let constraints: Constraint[] = [];
  let rejections: Rejection[] = [];

  if (searchType === "constraints" || searchType === "all") {
    constraints = db.prepare(`
      SELECT * FROM constraints
      WHERE title LIKE ? OR rule LIKE ? OR reasoning LIKE ? OR tags LIKE ?
      ORDER BY created_at DESC
    `).all(pattern, pattern, pattern, pattern) as unknown as Constraint[];
  }

  if (searchType === "rejections" || searchType === "all") {
    rejections = db.prepare(`
      SELECT * FROM rejections
      WHERE description LIKE ? OR reasoning LIKE ?
      ORDER BY created_at DESC
    `).all(pattern, pattern) as unknown as Rejection[];
  }

  return { constraints, rejections };
}
