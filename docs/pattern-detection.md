# Pattern Detection

The `patterns` tool surfaces recurring themes in unencoded rejections — the "you keep saying the same no" detector. It finds rejections that look similar, groups them into clusters, and labels each cluster with a descriptive theme.

Source: `src/tools/patterns.ts`

## Pipeline

```
Query → Tokenize → TF-IDF → Cluster → Theme → Output
```

### 1. Query

Fetches all **unencoded** rejections (no linked constraint) from the database within a time window. Defaults to the last 30 days. Optionally filters by domain.

```sql
SELECT id, domain, description, reasoning
FROM rejections
WHERE constraint_id IS NULL AND created_at >= ?
```

Rejections are then grouped by domain so clustering happens within each domain independently.

### 2. Tokenize

Each rejection's description and reasoning (if present) are combined into a single text block and processed through:

**Lowercasing and splitting** — Text is split on non-alphanumeric characters into individual words.

**Stop word removal** — Two categories of stop words are filtered:
- Standard English function words (articles, prepositions, pronouns, etc.)
- AI/code-review noise words that appear in almost every rejection but carry no clustering signal: `code`, `output`, `generated`, `file`, `make`, etc.

Words shorter than 3 characters are also discarded.

**Stemming** — A lightweight suffix stemmer reduces words to their approximate root form. This ensures that "logging", "logged", and "log" all converge to the same token, improving cluster formation.

The stemmer uses tiered suffix rules with minimum word length guards:
- **Long suffixes** (e.g. `-ation`, `-mentation`, `-ically`) are safe to strip from any word
- **Medium suffixes** (e.g. `-ness`, `-able`) require the word to be at least 8 characters
- **Short suffixes** (e.g. `-ing`, `-ed`, `-s`) require at least 6 characters

This prevents over-stemming short words (e.g. "types" stays "types" instead of being mangled to "typ"). After suffix stripping, trailing doubled consonants are collapsed ("logg" becomes "log").

**Bigram generation** — Adjacent stemmed tokens are joined with an underscore to form bigrams (e.g. "error" + "handl" produces the additional token "error_handl"). This captures phrases as units, so rejections sharing the phrase "error handling" score higher in similarity than those sharing the words independently.

The final output is an array of tokens (unigrams + bigrams) with duplicates preserved for term frequency counting.

### 3. TF-IDF

Tokens are weighted using TF-IDF (Term Frequency - Inverse Document Frequency) to ensure that domain-specific terms dominate over generic words.

**Term Frequency (TF)** — For each rejection, the count of each token is divided by the total number of tokens in that rejection. This normalizes for document length.

**Inverse Document Frequency (IDF)** — For each token, `log(N / df)` where N is the total number of rejections in the domain and df is the number of rejections containing that token. Tokens appearing in every rejection get IDF close to 0; rare, distinctive tokens get high IDF.

**TF-IDF vector** — Each rejection becomes a sparse vector where each dimension is a token and the value is `TF × IDF`. Tokens with zero IDF (appearing in every document) are excluded from the vector entirely.

### 4. Cluster

Clustering uses **cosine similarity** on TF-IDF vectors with **Union-Find**.

**Cosine similarity** measures the angle between two TF-IDF vectors:

```
similarity = (A · B) / (|A| × |B|)
```

Unlike Jaccard (which treats all tokens equally), cosine on TF-IDF vectors gives more weight to distinctive terms. Two rejections sharing rare, domain-specific phrases score much higher than two sharing only common words.

**Pairwise comparison** — Every pair of rejections within the same domain is compared. If their cosine similarity meets or exceeds the threshold (currently **0.15**), they are merged.

**Union-Find** — A disjoint-set data structure with path compression groups connected rejections transitively. If A is similar to B and B is similar to C, all three end up in the same cluster — even if A and C aren't directly similar. This produces broader, more inclusive clusters than simple pairwise grouping.

Clusters with fewer than 2 members are discarded (a "pattern" requires repetition).

### 5. Theme extraction

Each cluster gets a human-readable theme label derived from its most distinctive tokens.

**Member frequency × IDF scoring** — Every token across all cluster members is counted by how many members contain it. The score is `member_count × IDF`, which surfaces tokens that are common within the cluster but rare across the full rejection corpus.

**Bigram boost** — Bigrams receive a 2x multiplier since phrases are more descriptive than individual words.

**Threshold selection** — Only tokens present in more than 50% of members (minimum 2) are candidates.

**Fallback** — If no tokens meet the 50% threshold, the theme uses the highest-IDF tokens shared by all members. If even that yields nothing, the label falls back to "(similar rejections)".

The top 5 candidates by score become the theme, with bigram underscores replaced by spaces for readability.

### 6. Output

Results are sorted by cluster size (largest first) and returned as:

```typescript
interface PatternCluster {
  domain: string;        // The domain these rejections belong to
  theme: string;         // Human-readable label (e.g. "error handl, valid")
  count: number;         // Number of rejections in this cluster
  rejection_ids: string[]; // IDs for linking to a future constraint
  descriptions: string[];  // The rejection descriptions, for quick scanning
}
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `domain` | all | Filter to a specific domain |
| `since` | 30 days ago | ISO date string, only include rejections after this date |

Internal constants (not exposed as parameters):

| Constant | Value | Description |
|----------|-------|-------------|
| Similarity threshold | 0.15 | Minimum cosine similarity to merge two rejections |
| Minimum cluster size | 2 | Clusters smaller than this are discarded |
| Theme frequency threshold | 50% | Tokens must appear in this fraction of cluster members |
| Theme max tokens | 5 | Maximum tokens in the theme label |
| Bigram boost | 2x | Multiplier for bigram scores in theme extraction |

## Complexity

Pairwise comparison is O(n^2) where n is the number of unencoded rejections per domain. TF-IDF computation is O(n × v) where v is the vocabulary size. Both are fine for typical workloads (dozens to low hundreds of rejections per domain per month). For very large datasets, a future optimization could use locality-sensitive hashing (LSH) to approximate nearest neighbors.

## Future enhancements

Planned improvements (see Phase 3-4 in the development roadmap):

- **Temporal velocity** — Flag clusters where rejection frequency is accelerating
- **Leaky constraint detection** — Also cluster encoded rejections to find constraints that aren't working
- **Suggested constraint drafts** — Auto-generate a constraint title and rule from each cluster
