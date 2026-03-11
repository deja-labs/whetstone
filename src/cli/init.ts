import { mkdirSync } from "fs";

export async function runInit(): Promise<void> {
  // Create .whetstone directory structure
  mkdirSync(".whetstone/exports", { recursive: true });
  console.log("Created .whetstone/exports/");

  // Create empty db by importing connection (triggers schema creation)
  process.env.WHETSTONE_DB = ".whetstone/whetstone.db";
  const { getDb, closeDb } = await import("../db/connection.js");
  getDb(); // triggers creation
  closeDb();
  console.log("Created .whetstone/whetstone.db");

  console.log("\nDone. Commit the .whetstone/ directory to your repo.");
  console.log("");
  console.log("Next: run 'whetstone hook' to install the pre-push git hook.");
  console.log("This auto-exports a constraint snapshot before each push,");
  console.log("so constraint changes are visible in diffs alongside your code.");
}
