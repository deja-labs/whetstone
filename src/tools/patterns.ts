import { getDb } from "../db/connection.js";

export interface PatternsInput {
  domain?: string;
  since?: string;
}

export interface PatternCluster {
  domain: string;
  theme: string;
  count: number;
  rejection_ids: string[];
  descriptions: string[];
}

// ── Tokenization ────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "must",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
  "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "and", "but", "or", "nor", "not", "no", "so", "than", "too",
  "very", "just", "about", "up", "it", "its", "this", "that", "these",
  "those", "you", "he", "she", "we", "they", "me", "him", "her",
  "us", "them", "my", "your", "his", "our", "their", "what", "which",
  "who", "when", "where", "why", "how", "all", "each", "every", "both",
  "few", "more", "most", "other", "some", "such", "only", "own", "same",
  "don", "used", "using", "use", "instead",
]);

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

// ── Similarity ──────────────────────────────────────────────────────

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── Clustering ──────────────────────────────────────────────────────

interface RejectionRow {
  id: string;
  domain: string;
  description: string;
  reasoning: string | null;
}

function clusterBySimilarity(
  items: RejectionRow[],
  threshold: number,
): RejectionRow[][] {
  if (items.length === 0) return [];

  // Tokenize all items (description + reasoning for richer comparison)
  const tokenSets = items.map((item) => {
    const text = item.reasoning
      ? `${item.description} ${item.reasoning}`
      : item.description;
    return tokenize(text);
  });

  // Union-Find
  const parent = items.map((_, i) => i);
  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }
  function union(a: number, b: number): void {
    parent[find(a)] = find(b);
  }

  // Compare all pairs, union those above threshold
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (jaccardSimilarity(tokenSets[i], tokenSets[j]) >= threshold) {
        union(i, j);
      }
    }
  }

  // Group by root
  const groups = new Map<number, RejectionRow[]>();
  for (let i = 0; i < items.length; i++) {
    const root = find(i);
    const group = groups.get(root) ?? [];
    group.push(items[i]);
    groups.set(root, group);
  }

  return Array.from(groups.values());
}

// ── Main ────────────────────────────────────────────────────────────

export function patterns(input: PatternsInput): PatternCluster[] {
  const db = getDb();
  const since = input.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const conditions = ["constraint_id IS NULL", "created_at >= ?"];
  const params: unknown[] = [since];

  if (input.domain) {
    conditions.push("domain = ?");
    params.push(input.domain);
  }

  const rows = db.prepare(`
    SELECT id, domain, description, reasoning
    FROM rejections
    WHERE ${conditions.join(" AND ")}
    ORDER BY domain, created_at DESC
  `).all(...params) as unknown as RejectionRow[];

  // Group by domain
  const byDomain = new Map<string, RejectionRow[]>();
  for (const row of rows) {
    const group = byDomain.get(row.domain) ?? [];
    group.push(row);
    byDomain.set(row.domain, group);
  }

  const results: PatternCluster[] = [];

  for (const [domain, domainRows] of byDomain) {
    const clusters = clusterBySimilarity(domainRows, 0.25);

    for (const cluster of clusters) {
      if (cluster.length < 2) continue;

      // Extract shared tokens as the theme
      const allTokenSets = cluster.map((item) =>
        tokenize(item.reasoning ? `${item.description} ${item.reasoning}` : item.description),
      );
      const shared = [...allTokenSets[0]].filter((token) =>
        allTokenSets.every((s) => s.has(token)),
      );
      const theme = shared.length > 0
        ? shared.join(", ")
        : "(similar rejections)";

      results.push({
        domain,
        theme,
        count: cluster.length,
        rejection_ids: cluster.map((c) => c.id),
        descriptions: cluster.map((c) => c.description),
      });
    }
  }

  results.sort((a, b) => b.count - a.count);
  return results;
}
