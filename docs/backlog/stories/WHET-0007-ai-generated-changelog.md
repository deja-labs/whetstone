---
id: WHET-0007
title: AI-generated changelog via Claude API
status: done
priority: medium
created: 2026-03-12
completed: 2026-03-12
---

# WHET-0007: AI-generated changelog via Claude API

## Problem

The current `scripts/changelog.mjs` generates changelogs from raw commit messages (`git log --pretty=format:"- %s (%h)"`). This produces a flat list of implementation-level descriptions that don't communicate the user-facing value of a release. Squash merges make it worse — one cryptic line per PR.

## Solution

Enhance the changelog script to call the Claude API with commit messages and diffs, producing polished, grouped release notes. The API key is read from an environment variable (`ANTHROPIC_API_KEY`). If the key is missing, fall back to the current raw commit log behavior so the release process never blocks.

### Approach

1. Gather `git log` messages and `git diff --stat` (plus optionally full diffs under a size cap) since the last tag
2. Send to Claude API with a prompt that asks for:
   - Grouped sections (Features, Improvements, Fixes, Documentation, Internal)
   - User-facing language (what changed, not how)
   - Concise bullet points
3. Write the response into CHANGELOG.md in the existing format
4. Optionally allow `--dry-run` to preview without writing

### API Details

- Model: `claude-sonnet-4-6` (fast, cheap, good enough for summarization)
- Use the `@anthropic-ai/sdk` npm package (already TypeScript-native)
- Max input: commit messages + diff stat + truncated full diff (cap at ~50k tokens)
- Max output: ~2k tokens

## Tasks

- [x] Add `@anthropic-ai/sdk` as a dev dependency
- [x] Update `scripts/changelog.mjs` to gather commits + diff stat since last tag
- [x] Add Claude API call with release notes prompt
- [x] Graceful fallback when `ANTHROPIC_API_KEY` is not set
- [x] Add `--dry-run` flag to preview without writing
- [x] Test with a real release cycle
- [x] Document the `ANTHROPIC_API_KEY` env var in CLAUDE.md

## Notes

The API key should never be committed. It's expected in the environment at release time only. Consider also supporting `CLAUDE_API_KEY` as an alias.

The prompt should include the project description from CLAUDE.md so the model understands what Whetstone is and can write contextually appropriate notes.
