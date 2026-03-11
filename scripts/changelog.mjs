#!/usr/bin/env node

// scripts/changelog.mjs
// Generates/updates CHANGELOG.md from git log.
// Usage: node scripts/changelog.mjs <new-version>

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";

const newVersion = process.argv[2];
if (!newVersion) {
  console.error("Usage: node scripts/changelog.mjs <version>");
  process.exit(1);
}

const date = new Date().toISOString().split("T")[0];

// Find the previous tag (if any) to scope the log
// Use git tag --sort to find the latest tag across all branches,
// since the release branch may not have tags in its ancestry
let range = "";
try {
  const prevTag = execSync("git tag --sort=-v:refname 2>/dev/null", {
    encoding: "utf-8",
  }).trim().split("\n")[0];
  if (prevTag) {
    range = `${prevTag}..HEAD`;
  }
} catch {
  // No tags — include all commits
  range = "";
}

// Get commits since last tag (or all commits)
// Skip release commits and whetstone snapshot commits
const log = execSync(
  `git log ${range} --pretty=format:"- %s (%h)" --no-merges --invert-grep --grep="^release: v" --grep="^whetstone: "`,
  { encoding: "utf-8" }
).trim();

const header = `## [${newVersion}] - ${date}`;
const newEntry = `${header}\n\n${log}`;

const changelogPath = "CHANGELOG.md";
const preamble = "# Changelog\n\nAll notable changes to Whetstone are documented here.\n";

if (existsSync(changelogPath)) {
  const existing = readFileSync(changelogPath, "utf-8");
  // Insert new entry after the preamble header
  const content = existing.replace(
    /^# Changelog\n\n(?:All notable changes[^\n]*\n)?/,
    `${preamble}\n${newEntry}\n\n`
  );
  writeFileSync(changelogPath, content);
} else {
  writeFileSync(changelogPath, `${preamble}\n${newEntry}\n`);
}

console.log(`  \x1b[32mUpdated CHANGELOG.md\x1b[0m`);
