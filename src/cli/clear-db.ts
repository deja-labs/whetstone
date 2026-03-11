import { resolve } from "path";
import { existsSync, unlinkSync } from "fs";
import { createInterface } from "readline";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function parseArgs(args: string[]): { dbPath: string; force: boolean } {
  let dbOverride: string | undefined;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--db" && i + 1 < args.length) {
      dbOverride = args[++i];
    } else if (args[i] === "--force" || args[i] === "-f") {
      force = true;
    }
  }

  if (dbOverride) {
    process.env.WHETSTONE_DB = dbOverride;
  }

  const raw = process.env.WHETSTONE_DB || ".whetstone/whetstone.db";
  return { dbPath: resolve(raw), force };
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((res) => {
    rl.question(prompt, (answer) => {
      rl.close();
      res(answer.trim().toLowerCase() === "yes");
    });
  });
}

export async function runClearDb(args: string[]): Promise<void> {
  const { dbPath, force } = parseArgs(args);

  if (!existsSync(dbPath)) {
    console.error(`${YELLOW}No database found at ${dbPath}${RESET}`);
    process.exit(1);
  }

  console.error(`${BOLD}Database:${RESET} ${dbPath}`);

  // Show what will be lost
  try {
    const { getDb, closeDb } = await import("../db/connection.js");
    const db = getDb();
    const rejections = (db.prepare("SELECT COUNT(*) as count FROM rejections").get() as { count: number }).count;
    const constraints = (db.prepare("SELECT COUNT(*) as count FROM constraints").get() as { count: number }).count;
    closeDb();
    console.error(`${DIM}Contains: ${rejections} rejections, ${constraints} constraints${RESET}`);
  } catch {
    // DB might be corrupt — that's fine, we're deleting it anyway
  }

  if (!force) {
    console.error("");
    console.error(`${RED}${BOLD}This will permanently delete all rejections and constraints.${RESET}`);
    const ok = await confirm(`${YELLOW}Type "yes" to confirm: ${RESET}`);
    if (!ok) {
      console.error("Aborted.");
      process.exit(1);
    }
  }

  // Remove database and WAL/SHM files
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = dbPath + suffix;
    if (existsSync(file)) {
      unlinkSync(file);
    }
  }

  // Recreate with fresh schema
  const { getDb, closeDb } = await import("../db/connection.js");
  getDb(); // triggers creation + migrations
  closeDb();

  console.error(`${GREEN}Database cleared and recreated at ${dbPath}${RESET}`);
}
