---
id: WHET-0011
title: Confidence score on suggested constraints
status: draft
priority: medium
created: 2026-03-12
---

# WHET-0011: Confidence score on suggested constraints

## Problem

Suggested constraint drafts from pattern detection are presented without any indication of how confident the system is in the suggestion. A cluster of 2 loosely related rejections gets the same treatment as a tight cluster of 8 near-identical ones. Users can't prioritize which suggestions to act on first.

## Solution

Add a confidence score (0–100) to each suggested constraint, computed from cluster quality signals. Display it as a visual indicator on pattern cards in the dashboard.

### Signals to incorporate

- **Cluster size** — more rejections = higher confidence
- **Intra-cluster similarity** — average pairwise cosine similarity among cluster members (tighter = better)
- **Velocity** — accelerating patterns are more urgent
- **Theme coherence** — how many theme tokens are shared across most members
- **Description overlap** — how similar the rejection descriptions are (distinct from TF-IDF similarity which includes reasoning)

### Scoring

Weighted combination of normalized signals. Exact weights TBD after testing with real data.

## Tasks

- [ ] Compute average intra-cluster cosine similarity in `patterns.ts`
- [ ] Define confidence formula combining size, similarity, velocity, theme coherence
- [ ] Add `confidence` field to `SuggestedConstraint` interface
- [ ] Display confidence as a badge or meter on pattern cards (e.g. "High", "Medium", "Low" or a percentage)
- [ ] Sort suggested constraints by confidence when multiple exist
- [ ] Add confidence to MCP tool output and CLI format

## Notes

Start simple — size + average similarity is probably enough for a useful v1. Can layer on velocity and coherence later. Avoid false precision — "High / Medium / Low" may communicate better than a percentage.
