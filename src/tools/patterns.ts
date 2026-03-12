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

// ── Stop words ───────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  // English function words
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
  // AI/code-review noise — words that appear in almost every rejection
  "code", "output", "generated", "added", "file", "also", "like",
  "want", "make", "made", "get", "got", "put", "set", "let",
  "thing", "things", "way", "still", "already", "something",
]);

// ── Stemming ─────────────────────────────────────────────────────────

// Lightweight suffix stemmer — no dependencies, conservative by design.
// Uses two rule tiers: long suffixes (safe to strip from any word) and
// short suffixes (only stripped from words >= 6 chars to avoid over-stemming).

// [pattern, replacement, minWordLength]
const SUFFIX_RULES: [RegExp, string, number][] = [
  // Long suffixes — unambiguous, safe on any word
  [/ational$/, "ate", 0],
  [/tional$/, "tion", 0],
  [/fulness$/, "ful", 0],
  [/ousness$/, "ous", 0],
  [/iveness$/, "ive", 0],
  [/ically$/, "ic", 0],
  [/mentation$/, "ment", 0],
  [/isation$/, "ise", 0],
  [/ization$/, "ize", 0],
  [/ation$/, "", 0],
  [/ments$/, "ment", 0],
  [/iness$/, "y", 0],
  [/ingly$/, "ing", 0],
  [/ally$/, "al", 0],
  [/ably$/, "able", 0],
  // Medium suffixes — require word >= 8 chars
  [/ness$/, "", 8],
  [/able$/, "", 8],
  [/ible$/, "", 8],
  [/ling$/, "l", 8],
  // Short suffixes — require word >= 6 chars to avoid mangling short roots
  [/ies$/, "y", 6],
  [/ied$/, "y", 6],
  [/ing$/, "", 6],
  [/eed$/, "ee", 6],
  [/ely$/, "e", 6],
  [/ed$/, "", 6],
  [/ly$/, "", 6],
  [/er$/, "", 6],
  [/es$/, "", 6],
  [/ss$/, "ss", 0],  // keep "class", "pass" etc — must precede /s$/
  [/s$/, "", 6],
];

function stem(word: string): string {
  if (word.length <= 4) return word;

  let result = word;
  for (const [suffix, replacement, minLen] of SUFFIX_RULES) {
    if (word.length >= minLen && suffix.test(result)) {
      const stemmed = result.replace(suffix, replacement);
      // Stem must be at least 3 chars and contain a vowel
      if (stemmed.length >= 3 && /[aeiouy]/.test(stemmed)) {
        result = stemmed;
        break;
      }
    }
  }

  // Collapse trailing doubled consonants: "logg" → "log", "runn" → "run"
  if (result.length >= 4 && result[result.length - 1] === result[result.length - 2]) {
    const ch = result[result.length - 1];
    if (!/[aeiou]/.test(ch)) {
      result = result.slice(0, -1);
    }
  }

  return result;
}

// ── Tokenization ─────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
    .map(stem);
}

function tokenizeToSet(text: string): Set<string> {
  const words = tokenize(text);

  // Add bigrams — captures phrases like "error_handling", "type_check"
  const tokens = new Set(words);
  for (let i = 0; i < words.length - 1; i++) {
    tokens.add(words[i] + "_" + words[i + 1]);
  }

  return tokens;
}

// ── Similarity ───────────────────────────────────────────────────────

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── Theme extraction ─────────────────────────────────────────────────

function extractTheme(tokenSets: Set<string>[]): string {
  if (tokenSets.length === 0) return "(similar rejections)";

  // Count how many members contain each token
  const freq = new Map<string, number>();
  for (const s of tokenSets) {
    for (const token of s) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
  }

  // Tokens present in >50% of cluster members, prefer bigrams
  const threshold = Math.max(2, Math.ceil(tokenSets.length * 0.5));
  const candidates: [string, number][] = [];
  for (const [token, count] of freq) {
    if (count >= threshold) {
      // Bigrams score higher — they're more descriptive
      const score = token.includes("_") ? count * 2 : count;
      candidates.push([token, score]);
    }
  }

  if (candidates.length === 0) {
    // Fallback: tokens present in all members
    const shared = [...tokenSets[0]].filter((t) =>
      tokenSets.every((s) => s.has(t)),
    );
    return shared.length > 0
      ? shared.map(formatToken).join(", ")
      : "(similar rejections)";
  }

  // Sort by score descending, take top 5
  candidates.sort((a, b) => b[1] - a[1]);
  return candidates
    .slice(0, 5)
    .map(([token]) => formatToken(token))
    .join(", ");
}

function formatToken(token: string): string {
  return token.replace(/_/g, " ");
}

// ── Clustering ───────────────────────────────────────────────────────

interface RejectionRow {
  id: string;
  domain: string;
  description: string;
  reasoning: string | null;
}

function rejectionText(item: RejectionRow): string {
  return item.reasoning
    ? `${item.description} ${item.reasoning}`
    : item.description;
}

function clusterBySimilarity(
  items: RejectionRow[],
  threshold: number,
): RejectionRow[][] {
  if (items.length === 0) return [];

  const tokenSets = items.map((item) => tokenizeToSet(rejectionText(item)));

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

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (jaccardSimilarity(tokenSets[i], tokenSets[j]) >= threshold) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, RejectionRow[]>();
  for (let i = 0; i < items.length; i++) {
    const root = find(i);
    const group = groups.get(root) ?? [];
    group.push(items[i]);
    groups.set(root, group);
  }

  return Array.from(groups.values());
}

// ── Main ─────────────────────────────────────────────────────────────

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

      const tokenSets = cluster.map((item) =>
        tokenizeToSet(rejectionText(item)),
      );
      const theme = extractTheme(tokenSets);

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
