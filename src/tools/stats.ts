import { getDb } from "../db/connection.js";

export interface StatsResult {
  total_rejections: number;
  total_constraints: number;
  active_constraints: number;
  rejections_by_domain: Array<{ domain: string; count: number }>;
  encoded_by_domain: Array<{ domain: string; count: number }>;
  most_applied: Array<{ id: string; title: string; domain: string; severity: string; times_applied: number }>;
  unencoded_rejections: number;
  stale_constraints: Array<{ id: string; title: string; domain: string; severity: string; created_at: string }>;
  elevation_candidates: Array<{ id: string; title: string; domain: string; severity: string; times_applied: number }>;
  recently_encoded: Array<{ id: string; description: string; domain: string; constraint_id: string; created_at: string }>;
}

export function stats(): StatsResult {
  const db = getDb();

  const totalRejections = (db.prepare("SELECT COUNT(*) as count FROM rejections").get() as { count: number }).count;
  const totalConstraints = (db.prepare("SELECT COUNT(*) as count FROM constraints").get() as { count: number }).count;
  const activeConstraints = (db.prepare("SELECT COUNT(*) as count FROM constraints WHERE status = 'active'").get() as { count: number }).count;
  const unencodedRejections = (db.prepare("SELECT COUNT(*) as count FROM rejections WHERE constraint_id IS NULL").get() as { count: number }).count;

  const rejectionsByDomain = db.prepare(`
    SELECT domain, COUNT(*) as count FROM rejections
    GROUP BY domain ORDER BY count DESC
  `).all() as Array<{ domain: string; count: number }>;

  const encodedByDomain = db.prepare(`
    SELECT domain, COUNT(*) as count FROM rejections
    WHERE constraint_id IS NOT NULL
    GROUP BY domain ORDER BY count DESC
  `).all() as Array<{ domain: string; count: number }>;

  const mostApplied = db.prepare(`
    SELECT id, title, domain, severity, times_applied, rule, reasoning, rejected_example, accepted_example FROM constraints
    WHERE status = 'active' AND times_applied > 0
    ORDER BY times_applied DESC
    LIMIT 10
  `).all() as Array<{ id: string; title: string; domain: string; severity: string; times_applied: number; rule: string; reasoning: string | null; rejected_example: string | null; accepted_example: string | null }>;

  // Active constraints with 0 applications, older than 30 days
  const staleConstraints = db.prepare(`
    SELECT id, title, domain, severity, created_at, rule, reasoning, rejected_example, accepted_example FROM constraints
    WHERE status = 'active'
      AND times_applied = 0
      AND created_at <= ?
    ORDER BY created_at ASC
    LIMIT 10
  `).all(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) as Array<{
    id: string; title: string; domain: string; severity: string; created_at: string;
  }>;

  // Frequently applied constraints that aren't critical yet
  const elevationCandidates = db.prepare(`
    SELECT id, title, domain, severity, times_applied, rule, reasoning, rejected_example, accepted_example FROM constraints
    WHERE status = 'active'
      AND times_applied >= 5
      AND severity != 'critical'
    ORDER BY times_applied DESC
    LIMIT 10
  `).all() as Array<{
    id: string; title: string; domain: string; severity: string; times_applied: number;
  }>;

  const recentlyEncoded = db.prepare(`
    SELECT id, description, domain, constraint_id, created_at FROM rejections
    WHERE constraint_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 10
  `).all() as Array<{
    id: string; description: string; domain: string; constraint_id: string; created_at: string;
  }>;

  return {
    total_rejections: totalRejections,
    total_constraints: totalConstraints,
    active_constraints: activeConstraints,
    rejections_by_domain: rejectionsByDomain,
    encoded_by_domain: encodedByDomain,
    most_applied: mostApplied,
    unencoded_rejections: unencodedRejections,
    stale_constraints: staleConstraints,
    elevation_candidates: elevationCandidates,
    recently_encoded: recentlyEncoded,
  };
}
