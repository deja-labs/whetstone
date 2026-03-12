import { getDb } from "../db/connection.js";

export interface PatternsInput {
  domain?: string;
  since?: string;
  include_encoded?: boolean;
  suggest_constraints?: boolean;
}

export interface SuggestedConstraint {
  title: string;
  rule: string;
  category: string;
  severity: string;
}

export interface PatternCluster {
  domain: string;
  theme: string;
  count: number;
  rejection_ids: string[];
  descriptions: string[];
  velocity: number;          // ratio of recent vs older rejection frequency (>1 = accelerating)
  leaky_constraint_id?: string;  // if set, these encoded rejections keep recurring despite this constraint
  leaky_constraint_title?: string;
  suggested_constraint?: SuggestedConstraint;
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

// Returns an array of tokens (unigrams + bigrams) with duplicates preserved
// for term frequency counting.
function tokenizeWithBigrams(text: string): string[] {
  const words = tokenize(text);
  const tokens = words.slice();
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(words[i] + "_" + words[i + 1]);
  }
  return tokens;
}

// ── TF-IDF ───────────────────────────────────────────────────────────

// Term frequency: count of each token in a document, normalized by doc length.
function computeTf(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const tf = new Map<string, number>();
  for (const [term, count] of counts) {
    tf.set(term, count / tokens.length);
  }
  return tf;
}

// Inverse document frequency: log(N / df) where df = number of documents
// containing the term. Tokens appearing in every document get IDF ≈ 0.
function computeIdf(documents: Map<string, number>[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of documents) {
    for (const term of doc.keys()) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const n = documents.length;
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log(n / count));
  }
  return idf;
}

// TF-IDF vector for a single document.
function tfidfVector(tf: Map<string, number>, idf: Map<string, number>): Map<string, number> {
  const vec = new Map<string, number>();
  for (const [term, tfVal] of tf) {
    const idfVal = idf.get(term) ?? 0;
    const weight = tfVal * idfVal;
    if (weight > 0) {
      vec.set(term, weight);
    }
  }
  return vec;
}

// Cosine similarity between two sparse TF-IDF vectors.
function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, wa] of a) {
    normA += wa * wa;
    const wb = b.get(term);
    if (wb !== undefined) {
      dot += wa * wb;
    }
  }
  for (const wb of b.values()) {
    normB += wb * wb;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Theme extraction ─────────────────────────────────────────────────

function extractTheme(
  tfidfVectors: Map<string, number>[],
  idf: Map<string, number>,
): string {
  if (tfidfVectors.length === 0) return "(similar rejections)";

  // Score each token by: (number of members containing it) × IDF.
  // This surfaces tokens that are common within the cluster but rare overall.
  const memberCount = new Map<string, number>();
  for (const vec of tfidfVectors) {
    for (const term of vec.keys()) {
      memberCount.set(term, (memberCount.get(term) ?? 0) + 1);
    }
  }

  const threshold = Math.max(2, Math.ceil(tfidfVectors.length * 0.5));
  const candidates: [string, number][] = [];
  for (const [token, count] of memberCount) {
    if (count >= threshold) {
      const idfVal = idf.get(token) ?? 1;
      // Bigrams get a 2x boost — they're more descriptive
      const bigramBoost = token.includes("_") ? 2 : 1;
      candidates.push([token, count * idfVal * bigramBoost]);
    }
  }

  if (candidates.length === 0) {
    // Fallback: highest-IDF tokens present in all members
    const allShared: [string, number][] = [];
    for (const [token, count] of memberCount) {
      if (count === tfidfVectors.length) {
        allShared.push([token, idf.get(token) ?? 0]);
      }
    }
    allShared.sort((a, b) => b[1] - a[1]);
    return allShared.length > 0
      ? allShared.slice(0, 5).map(([t]) => formatToken(t)).join(", ")
      : "(similar rejections)";
  }

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
  created_at: string;
  constraint_id: string | null;
}

function rejectionText(item: RejectionRow): string {
  return item.reasoning
    ? `${item.description} ${item.reasoning}`
    : item.description;
}

function clusterBySimilarity(
  items: RejectionRow[],
  threshold: number,
): { clusters: RejectionRow[][]; tfidfVecs: Map<string, number>[]; idf: Map<string, number> } {
  if (items.length === 0) return { clusters: [], tfidfVecs: [], idf: new Map() };

  // Tokenize all documents
  const allTokens = items.map((item) => tokenizeWithBigrams(rejectionText(item)));

  // Compute TF for each document
  const tfMaps = allTokens.map(computeTf);

  // Compute IDF across the corpus
  const idf = computeIdf(tfMaps);

  // Build TF-IDF vectors
  const tfidfVecs = tfMaps.map((tf) => tfidfVector(tf, idf));

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

  // Compare all pairs using cosine similarity on TF-IDF vectors
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (cosineSimilarity(tfidfVecs[i], tfidfVecs[j]) >= threshold) {
        union(i, j);
      }
    }
  }

  // Group by root
  const groups = new Map<number, number[]>();
  for (let i = 0; i < items.length; i++) {
    const root = find(i);
    const group = groups.get(root) ?? [];
    group.push(i);
    groups.set(root, group);
  }

  const clusters = Array.from(groups.values()).map(
    (indices) => indices.map((i) => items[i]),
  );

  return { clusters, tfidfVecs, idf };
}

// ── Main ─────────────────────────────────────────────────────────────

// Cosine similarity threshold — higher than Jaccard's 0.25 because cosine
// on TF-IDF vectors produces tighter, more meaningful scores.
const SIMILARITY_THRESHOLD = 0.15;

// ── Velocity ─────────────────────────────────────────────────────────

// Compute velocity: ratio of recent rejection rate vs older rate.
// Splits the time window into a "recent" period (last 25%) and "older" (first 75%).
// velocity > 1 means rejections are accelerating; < 1 means decelerating.
function computeVelocity(cluster: RejectionRow[], sinceMs: number, nowMs: number): number {
  const windowMs = nowMs - sinceMs;
  if (windowMs <= 0) return 1;

  // Split point: 75% of the way through the window
  const recentCutoff = sinceMs + windowMs * 0.75;
  const olderDurationDays = (recentCutoff - sinceMs) / (24 * 60 * 60 * 1000);
  const recentDurationDays = (nowMs - recentCutoff) / (24 * 60 * 60 * 1000);

  if (olderDurationDays <= 0 || recentDurationDays <= 0) return 1;

  let olderCount = 0;
  let recentCount = 0;
  for (const item of cluster) {
    const ts = new Date(item.created_at).getTime();
    if (ts >= recentCutoff) {
      recentCount++;
    } else {
      olderCount++;
    }
  }

  const olderRate = olderCount / olderDurationDays;
  const recentRate = recentCount / recentDurationDays;

  // Avoid division by zero — if no older rejections, any recent ones = high velocity
  if (olderRate === 0) return recentCount > 0 ? 5 : 1;

  return Math.round((recentRate / olderRate) * 100) / 100;
}

// ── Leaky constraint detection ──────────────────────────────────────

interface ConstraintInfo {
  id: string;
  title: string;
}

// Find clusters of encoded rejections that share the same constraint — these
// are "leaky" constraints that aren't preventing the rejections they encode.
function findLeakyConstraints(
  cluster: RejectionRow[],
  db: ReturnType<typeof getDb>,
): { constraint_id: string; title: string } | undefined {
  // Count which constraint_id appears most in this cluster
  const constraintCounts = new Map<string, number>();
  for (const item of cluster) {
    if (item.constraint_id) {
      constraintCounts.set(item.constraint_id, (constraintCounts.get(item.constraint_id) ?? 0) + 1);
    }
  }

  if (constraintCounts.size === 0) return undefined;

  // Find the most common constraint
  let maxId = "";
  let maxCount = 0;
  for (const [id, count] of constraintCounts) {
    if (count > maxCount) {
      maxId = id;
      maxCount = count;
    }
  }

  // Only flag as leaky if the constraint accounts for a majority of the cluster
  if (maxCount < Math.ceil(cluster.length * 0.5)) return undefined;

  const row = db.prepare("SELECT title FROM constraints WHERE id = ?").get(maxId) as ConstraintInfo | undefined;
  return row ? { constraint_id: maxId, title: row.title } : undefined;
}

// ── Suggested constraint drafts ─────────────────────────────────────

// Category keywords — map common token stems to constraint categories
const CATEGORY_SIGNALS: Record<string, string[]> = {
  "code-quality": ["error", "handl", "log", "test", "type", "valid", "format", "lint", "style", "naming", "refactor", "clean", "import", "export", "depend"],
  "pattern": ["pattern", "struct", "architect", "design", "abstraction", "compon", "modul", "layer", "separ", "encapsul", "interfac", "implement"],
  "business-logic": ["logic", "business", "requir", "rule", "workflow", "process", "calcul", "permiss", "author", "access", "secur"],
  "framing": ["explain", "context", "scope", "assum", "clarif", "ambigu", "interpret", "defin", "spec"],
  "reasoning": ["reason", "why", "justif", "rational", "decis", "tradeoff", "consider", "altern"],
  "editorial": ["tone", "voice", "word", "phras", "readab", "concis", "verbos", "comment", "document", "messag"],
};

function inferCategory(themeTokens: string[], descriptions: string[]): string {
  const allText = [...themeTokens, ...descriptions.map((d) => d.toLowerCase())].join(" ");

  let bestCategory = "pattern";
  let bestScore = 0;

  for (const [category, signals] of Object.entries(CATEGORY_SIGNALS)) {
    let score = 0;
    for (const signal of signals) {
      if (allText.includes(signal)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

function inferSeverity(velocity: number, count: number): string {
  if (velocity >= 3 || count >= 5) return "critical";
  if (velocity >= 1.5 || count >= 3) return "important";
  return "preference";
}

function generateConstraintDraft(
  theme: string,
  descriptions: string[],
  velocity: number,
  count: number,
): SuggestedConstraint {
  // Build title from theme — capitalize and clean up stemmed tokens
  const themeWords = theme.split(", ").slice(0, 3);
  const title = themeWords.length > 0
    ? `Avoid ${themeWords.join(" / ")} issues`
    : "Address recurring rejection pattern";

  // Build rule from the most common description patterns
  // Find the shortest description as the most concise summary of the issue
  const sorted = [...descriptions].sort((a, b) => a.length - b.length);
  const representative = sorted[0];

  // Construct an imperative rule
  const rule = descriptions.length === 1
    ? `Do not ${representative.charAt(0).toLowerCase()}${representative.slice(1).replace(/\.$/, "")}.`
    : `Do not ${representative.charAt(0).toLowerCase()}${representative.slice(1).replace(/\.$/, "")}. This pattern has occurred ${count} times.`;

  const category = inferCategory(themeWords, descriptions);
  const severity = inferSeverity(velocity, count);

  return { title, rule, category, severity };
}

export function patterns(input: PatternsInput): PatternCluster[] {
  const db = getDb();
  const nowMs = Date.now();
  const since = input.since ?? new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sinceMs = new Date(since).getTime();

  const conditions = ["created_at >= ?"];
  const params: unknown[] = [since];

  // By default only unencoded; with include_encoded, get all rejections
  if (!input.include_encoded) {
    conditions.push("constraint_id IS NULL");
  }

  if (input.domain) {
    conditions.push("domain = ?");
    params.push(input.domain);
  }

  const rows = db.prepare(`
    SELECT id, domain, description, reasoning, created_at, constraint_id
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
    const { clusters, tfidfVecs, idf } = clusterBySimilarity(domainRows, SIMILARITY_THRESHOLD);

    // Build an index mapping item ID → tfidf vector index
    const idToIdx = new Map<string, number>();
    for (let i = 0; i < domainRows.length; i++) {
      idToIdx.set(domainRows[i].id, i);
    }

    for (const cluster of clusters) {
      if (cluster.length < 2) continue;

      // Gather TF-IDF vectors for this cluster's members
      const clusterVecs = cluster.map((item) => tfidfVecs[idToIdx.get(item.id)!]);
      const theme = extractTheme(clusterVecs, idf);
      const velocity = computeVelocity(cluster, sinceMs, nowMs);

      const result: PatternCluster = {
        domain,
        theme,
        count: cluster.length,
        rejection_ids: cluster.map((c) => c.id),
        descriptions: cluster.map((c) => c.description),
        velocity,
      };

      // Check for leaky constraints (only relevant when include_encoded is set)
      if (input.include_encoded) {
        const leaky = findLeakyConstraints(cluster, db);
        if (leaky) {
          result.leaky_constraint_id = leaky.constraint_id;
          result.leaky_constraint_title = leaky.title;
        }
      }

      // Generate suggested constraint draft
      if (input.suggest_constraints) {
        result.suggested_constraint = generateConstraintDraft(
          theme,
          result.descriptions,
          velocity,
          cluster.length,
        );
      }

      results.push(result);
    }
  }

  // Sort by velocity × count (urgent recurring patterns first)
  results.sort((a, b) => (b.velocity * b.count) - (a.velocity * a.count));
  return results;
}
