#!/usr/bin/env node

// scripts/changelog.mjs
// Generates/updates CHANGELOG.md from git log.
// When ANTHROPIC_API_KEY is set, uses Claude to produce polished release notes.
// Falls back to raw commit log when no API key is available.
//
// Usage: node scripts/changelog.mjs <new-version> [--dry-run]

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const noAi = args.includes("--noai");
const newVersion = args.find((a) => !a.startsWith("--"));

if (!newVersion) {
  console.error("Usage: node scripts/changelog.mjs <version> [--dry-run] [--noai]");
  process.exit(1);
}

const date = new Date().toISOString().split("T")[0];

// Find the previous tag (if any) to scope the log
// Use git tag --sort to find the latest tag across all branches,
// since the release branch may not have tags in its ancestry
let range = "";
let prevTag = "";
try {
  prevTag = execSync("git tag --sort=-v:refname 2>/dev/null", {
    encoding: "utf-8",
  })
    .trim()
    .split("\n")[0];
  if (prevTag) {
    range = `${prevTag}..HEAD`;
  }
} catch {
  // No tags — include all commits
}

// Get commits since last tag (or all commits)
// Skip release commits and whetstone snapshot commits
const rawLog = execSync(
  `git log ${range} --pretty=format:"- %s (%h)" --no-merges --invert-grep --grep="^release: v" --grep="^whetstone: "`,
  { encoding: "utf-8" }
).trim();

// Get commit messages (without hashes) for AI prompt
const commitMessages = execSync(
  `git log ${range} --pretty=format:"%s" --no-merges --invert-grep --grep="^release: v" --grep="^whetstone: "`,
  { encoding: "utf-8" }
).trim();

// Get diff stat for context
const diffStat = execSync(`git diff --stat ${prevTag || "HEAD~50"}..HEAD`, {
  encoding: "utf-8",
}).trim();

// Get full diff (capped to avoid token limits)
let fullDiff = "";
try {
  fullDiff = execSync(
    `git diff ${prevTag || "HEAD~50"}..HEAD -- "*.ts" "*.mjs"`,
    {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 5, // 5MB
    }
  );
  // Cap at ~100k chars (~25k tokens) to stay within limits
  if (fullDiff.length > 100_000) {
    fullDiff =
      fullDiff.slice(0, 100_000) + "\n\n[... diff truncated for length ...]";
  }
} catch {
  // Diff too large or failed — proceed without it
}

// Gather story metadata from backlog for WHET code mapping
let storyContext = "";
try {
  const { readdirSync } = await import("fs");
  const storyDir = "docs/backlog/stories";
  if (existsSync(storyDir)) {
    const stories = readdirSync(storyDir)
      .filter((f) => f.startsWith("WHET-") && f.endsWith(".md"))
      .map((f) => {
        const content = readFileSync(`${storyDir}/${f}`, "utf-8");
        const idMatch = content.match(/^id:\s*(.+)$/m);
        const titleMatch = content.match(/^title:\s*(.+)$/m);
        const id = idMatch ? idMatch[1].trim() : f.replace(".md", "");
        const title = titleMatch ? titleMatch[1].trim() : "";
        return `- ${id}: ${title}`;
      });
    if (stories.length > 0) {
      storyContext = `\nHere are the WHET story codes for this project:\n\n${stories.join("\n")}\n`;
    }
  }
} catch {
  // No stories — proceed without
}

/**
 * Generate release notes using Claude API
 */
async function generateWithClaude(apiKey) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const prompt = `You are generating release notes for Whetstone MCP v${newVersion}.

Whetstone is an MCP server that captures human rejections of AI output and encodes them as durable constraints. It has a SQLite backend, a web dashboard, pattern detection for clustering similar rejections, and a CLI. The previous version was ${prevTag || "unknown"}.

Here are the commits in this release:

${commitMessages}

Here is the diff stat:

${diffStat}
${storyContext}
${fullDiff ? `Here is the full diff of source changes:\n\n${fullDiff}` : ""}

Write concise, polished release notes. Group changes into these sections (omit empty sections):

### Features
### Improvements
### Fixes
### Documentation
### Internal

Rules:
- Write from the user's perspective — what changed for them, not implementation details
- Each bullet should be one line, starting with a verb (Add, Fix, Improve, Update, Remove)
- If a change relates to a WHET story, prefix the bullet with the code in brackets, e.g. "[WHET-0007] Add AI-generated changelog..."
- Only add a WHET code if there is a clear match — do not force or guess
- Don't include commit hashes
- Don't include the version header — I'll add that myself
- Be concise — aim for 1-2 sentences per bullet maximum
- Combine related commits into single bullets where it makes sense
- Skip trivial changes (typo fixes, formatting) unless they're the only changes`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].text;
}

/**
 * Write the changelog entry
 */
function writeChangelog(body) {
  const header = `## [${newVersion}] - ${date}`;
  const newEntry = `${header}\n\n${body}`;
  const changelogPath = "CHANGELOG.md";
  const preamble =
    "# Changelog\n\nAll notable changes to Whetstone are documented here.\n";

  if (dryRun) {
    console.log(`\n${newEntry}\n`);
    return;
  }

  if (existsSync(changelogPath)) {
    const existing = readFileSync(changelogPath, "utf-8");
    const content = existing.replace(
      /^# Changelog\n\n(?:All notable changes[^\n]*\n)?/,
      `${preamble}\n${newEntry}\n\n`
    );
    writeFileSync(changelogPath, content);
  } else {
    writeFileSync(changelogPath, `${preamble}\n${newEntry}\n`);
  }

  console.log(`  \x1b[32mUpdated CHANGELOG.md\x1b[0m`);
}

// Main
const apiKey = noAi ? null : (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);

if (apiKey) {
  console.log(`  \x1b[32m✓ Claude AI enabled\x1b[0m`);
  try {
    console.log(`  \x1b[36mGenerating release notes with Claude...\x1b[0m`);
    const notes = await generateWithClaude(apiKey);
    writeChangelog(notes);
  } catch (err) {
    console.error(
      `  \x1b[33mClaude API failed: ${err.message}\x1b[0m`
    );
    console.log(`  \x1b[33mFalling back to raw commit log\x1b[0m`);
    writeChangelog(rawLog);
  }
} else {
  console.log(
    `  \x1b[31m✗ Claude AI disabled\x1b[0m \x1b[2m(set ANTHROPIC_API_KEY to enable)\x1b[0m`
  );
  writeChangelog(rawLog);
}
