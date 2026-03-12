#!/usr/bin/env node

// scripts/draft-pr.mjs
// Generates a GitHub PR using the project's PR template and Claude AI.
// Requires ANTHROPIC_API_KEY to be set — fails if unavailable.
//
// Usage: node scripts/draft-pr.mjs [--dry-run] [--base=<branch>]

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const baseArg = args.find((a) => a.startsWith("--base="));
const base = baseArg ? baseArg.split("=")[1] : "develop";

const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

if (!apiKey) {
  console.error(
    "  \x1b[31m✗ ANTHROPIC_API_KEY is required for PR drafting\x1b[0m"
  );
  console.error(
    "  \x1b[2mSet it in .env or export it in your shell\x1b[0m"
  );
  process.exit(1);
}

// Get current branch
const branch = execSync("git rev-parse --abbrev-ref HEAD", {
  encoding: "utf-8",
}).trim();

if (branch === base) {
  console.error(
    `  \x1b[31m✗ Already on ${base} — switch to your feature branch first\x1b[0m`
  );
  process.exit(1);
}

// Check if there's already a PR for this branch
try {
  const existing = execSync(
    `gh pr view ${branch} --json url --jq .url 2>/dev/null`,
    { encoding: "utf-8" }
  ).trim();
  if (existing) {
    console.error(
      `  \x1b[33m⚠ PR already exists: ${existing}\x1b[0m`
    );
    process.exit(1);
  }
} catch {
  // No existing PR — good
}

console.log(`  \x1b[36mBranch:\x1b[0m ${branch}`);
console.log(`  \x1b[36mBase:\x1b[0m   ${base}`);

// Gather context
const commits = execSync(
  `git log ${base}..HEAD --pretty=format:"%s" --no-merges`,
  { encoding: "utf-8" }
).trim();

if (!commits) {
  console.error(
    `  \x1b[31m✗ No commits ahead of ${base}\x1b[0m`
  );
  process.exit(1);
}

const commitLog = execSync(
  `git log ${base}..HEAD --pretty=format:"- %s (%h)" --no-merges`,
  { encoding: "utf-8" }
).trim();

const diffStat = execSync(`git diff --stat ${base}...HEAD`, {
  encoding: "utf-8",
}).trim();

// Get full diff (capped)
let fullDiff = "";
try {
  fullDiff = execSync(
    `git diff ${base}...HEAD -- "*.ts" "*.mjs" "*.md"`,
    { encoding: "utf-8", maxBuffer: 1024 * 1024 * 5 }
  );
  if (fullDiff.length > 100_000) {
    fullDiff =
      fullDiff.slice(0, 100_000) + "\n\n[... diff truncated for length ...]";
  }
} catch {
  // Diff too large or failed
}

// Read PR template
let template = "";
const templatePath = ".github/pull_request_template.md";
if (existsSync(templatePath)) {
  template = readFileSync(templatePath, "utf-8");
}

// Gather story metadata
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
  // No stories
}

// Generate with Claude
console.log(`  \x1b[32m✓ Claude AI enabled\x1b[0m`);
console.log(`  \x1b[36mGenerating PR description...\x1b[0m`);

const Anthropic = (await import("@anthropic-ai/sdk")).default;
const client = new Anthropic({ apiKey });

const prompt = `You are generating a GitHub pull request for the Whetstone MCP project.

Branch: ${branch}
Base: ${base}

Here is the PR template to follow:

${template}

Here are the commits in this branch:

${commitLog}

Here is the diff stat:

${diffStat}
${storyContext}
${fullDiff ? `Here is the full diff:\n\n${fullDiff}` : ""}

Generate the PR content. You must output EXACTLY two sections separated by a line containing only "---SPLIT---":

1. First: the PR title (a single line, under 70 characters, no prefix like "feat:" or "fix:")
2. Then the separator: ---SPLIT---
3. Then: the PR body following the template structure

Rules:
- Fill in the template sections with real content based on the commits and diff
- Remove HTML comments (<!-- ... -->) from the output
- For WHET Stories: list any related WHET codes, or remove the section if none apply
- For Changes: write clear bullet points describing what changed
- For Test Plan: keep the checkboxes and add specific verification steps relevant to the changes
- For Notes: add any relevant context, or remove the section if nothing to note
- Be concise — this is a PR description, not documentation
- Do not wrap the output in markdown code fences`;

const message = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 2048,
  messages: [{ role: "user", content: prompt }],
});

const response = message.content[0].text;
const splitIndex = response.indexOf("---SPLIT---");

if (splitIndex === -1) {
  console.error("  \x1b[31m✗ Unexpected AI response format\x1b[0m");
  console.log(response);
  process.exit(1);
}

const title = response.slice(0, splitIndex).trim();
const body = response.slice(splitIndex + "---SPLIT---".length).trim();

if (dryRun) {
  console.log(`\n  \x1b[1mTitle:\x1b[0m ${title}\n`);
  console.log(body);
  process.exit(0);
}

// Create the PR as draft
console.log(`  \x1b[36mCreating draft PR...\x1b[0m`);

// Push branch if needed
try {
  execSync(`git rev-parse --verify origin/${branch} 2>/dev/null`, {
    encoding: "utf-8",
  });
} catch {
  console.log(`  \x1b[36mPushing branch to origin...\x1b[0m`);
  execSync(`git push -u origin ${branch}`, { stdio: "inherit" });
}

// Write body to temp file to avoid shell escaping issues
import { tmpdir } from "os";
import { join } from "path";
import { writeFileSync, unlinkSync } from "fs";

const tmpFile = join(tmpdir(), `whetstone-pr-${Date.now()}.md`);
writeFileSync(tmpFile, body);

try {
  const result = execSync(
    `gh pr create --draft --base ${base} --title "${title.replace(/"/g, '\\"')}" --body-file "${tmpFile}"`,
    { encoding: "utf-8" }
  );
  console.log(`  \x1b[32m✓ Draft PR created:\x1b[0m ${result.trim()}`);
} finally {
  try {
    unlinkSync(tmpFile);
  } catch {
    // cleanup failed — not critical
  }
}
