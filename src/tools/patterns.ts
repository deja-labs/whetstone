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
