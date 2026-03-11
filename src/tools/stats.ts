import { getDb } from "../db/connection.js";

export interface StatsResult {
  total_rejections: number;
  total_constraints: number;
  active_constraints: number;
  rejections_by_domain: Array<{ domain: string; count: number }>;
  most_applied: Array<{ id: string; title: string; domain: string; times_applied: number }>;
  unencoded_rejections: number;
  stale_constraints: Array<{ id: string; title: string; domain: string; severity: string; created_at: string }>;
  elevation_candidates: Array<{ id: string; title: string; domain: string; severity: string; times_applied: number }>;
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

  const mostApplied = db.prepare(`
    SELECT id, title, domain, times_applied FROM constraints
    WHERE status = 'active' AND times_applied > 0
    ORDER BY times_applied DESC
    LIMIT 10
  `).all() as Array<{ id: string; title: string; domain: string; times_applied: number }>;

  // Active constraints with 0 applications, older than 30 days
  const staleConstraints = db.prepare(`
    SELECT id, title, domain, severity, created_at FROM constraints
    WHERE status = 'active'
      AND times_applied = 0
      AND created_at <= ?
    ORDER BY created_at ASC
    LIMIT 10
  `).all(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) as Array<{
    id: string; title: string; domain: string; severity: string; created_at: string;
  }>;

  // Frequently applied constraints that aren't critical yet
  const elevationCandidates = db.prepare(`
    SELECT id, title, domain, severity, times_applied FROM constraints
    WHERE status = 'active'
      AND times_applied >= 5
      AND severity != 'critical'
    ORDER BY times_applied DESC
    LIMIT 10
  `).all() as Array<{
    id: string; title: string; domain: string; severity: string; times_applied: number;
  }>;

  return {
    total_rejections: totalRejections,
    total_constraints: totalConstraints,
    active_constraints: activeConstraints,
    rejections_by_domain: rejectionsByDomain,
    most_applied: mostApplied,
    unencoded_rejections: unencodedRejections,
    stale_constraints: staleConstraints,
    elevation_candidates: elevationCandidates,
  };
}
