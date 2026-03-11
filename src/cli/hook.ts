import { mkdirSync, writeFileSync, existsSync, readFileSync, chmodSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";

const WHETSTONE_HOOK = `#!/bin/sh
# .git/hooks/pre-push-whetstone — installed by whetstone hook

WHETSTONE_DB=".whetstone/whetstone.db"
EXPORT_DIR=".whetstone/exports"

if [ ! -f "$WHETSTONE_DB" ]; then
  exit 0
fi

mkdir -p "$EXPORT_DIR"

# Export to a temp file first
TMPFILE=$(mktemp)
whetstone-mcp export --format markdown --output "$TMPFILE" --db "$WHETSTONE_DB"

if [ $? -ne 0 ]; then
  rm -f "$TMPFILE"
  echo "whetstone: export failed, skipping snapshot"
  exit 0
fi

# Find the most recent existing export
LATEST=$(ls -t "$EXPORT_DIR"/*.md 2>/dev/null | head -1)

# Skip if content is identical to the latest export
if [ -n "$LATEST" ] && diff -q "$TMPFILE" "$LATEST" > /dev/null 2>&1; then
  rm -f "$TMPFILE"
  echo "whetstone: no constraint changes since last export, skipping"
  exit 0
fi

# Move temp file to timestamped export
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
EXPORT_FILE="$EXPORT_DIR/$TIMESTAMP.md"
mv "$TMPFILE" "$EXPORT_FILE"

git add "$EXPORT_FILE"
git commit --no-verify -m "whetstone: constraint snapshot $TIMESTAMP"

# Abort the push — git has already decided which commits to send,
# so the new snapshot commit won't be included. The user pushes again
# and the diff check passes through instantly (no changes).
echo "whetstone: snapshot committed — push again to include it"
exit 1
`;

const DISPATCHER = `#!/bin/sh
# .git/hooks/pre-push — dispatcher for hook scripts

# Run whetstone pre-push hook
if [ -x "$(dirname "$0")/pre-push-whetstone" ]; then
  "$(dirname "$0")/pre-push-whetstone" || exit $?
fi
`;

export { WHETSTONE_HOOK as HOOK_SCRIPT };

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export async function runHook(): Promise<void> {
  const gitHooksDir = join(".git", "hooks");
  if (!existsSync(".git")) {
    console.log("Error: not a git repository — cannot install hook.");
    process.exit(1);
  }

  mkdirSync(gitHooksDir, { recursive: true });

  const whetstoneHookPath = join(gitHooksDir, "pre-push-whetstone");
  const dispatcherPath = join(gitHooksDir, "pre-push");

  // Always write (or update) the whetstone hook script
  writeFileSync(whetstoneHookPath, WHETSTONE_HOOK, { mode: 0o755 });
  chmodSync(whetstoneHookPath, 0o755);
  console.log(`Installed ${whetstoneHookPath}`);

  // Handle the dispatcher (pre-push)
  if (existsSync(dispatcherPath)) {
    const existing = readFileSync(dispatcherPath, "utf-8");
    if (existing.includes("pre-push-whetstone")) {
      console.log("Dispatcher already calls pre-push-whetstone — done.");
      return;
    }

    // Existing pre-push that doesn't know about whetstone
    console.log(`\nExisting pre-push hook found at ${dispatcherPath}`);
    const answer = await prompt("Overwrite with whetstone dispatcher? (y/n) ");
    if (answer === "y" || answer === "yes") {
      writeFileSync(dispatcherPath, DISPATCHER, { mode: 0o755 });
      chmodSync(dispatcherPath, 0o755);
      console.log("Replaced pre-push hook with whetstone dispatcher.");
      console.log("Tip: add your previous hook logic to the dispatcher or as another sub-hook.");
    } else {
      console.log("Skipped. To enable whetstone, add this line to your pre-push hook:");
      console.log(`  "$(dirname "$0")/pre-push-whetstone"`);
    }
  } else {
    writeFileSync(dispatcherPath, DISPATCHER, { mode: 0o755 });
    chmodSync(dispatcherPath, 0o755);
    console.log(`Installed dispatcher at ${dispatcherPath}`);
  }
}
