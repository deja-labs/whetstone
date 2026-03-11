import { createRequire } from "module";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import { runMigrations } from "./migrations.js";

// sql.js doesn't have clean ESM exports — use createRequire
const require = createRequire(import.meta.url);
const initSqlJs: () => Promise<SqlJsStatic> = require("sql.js");

// Types from sql.js (avoid depending on its .d.ts export path)
interface SqlJsStatic {
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase;
}

interface SqlJsDatabase {
  run(sql: string, params?: unknown[]): SqlJsDatabase;
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>;
  prepare(sql: string): SqlJsStatement;
  getRowsModified(): number;
  export(): Uint8Array;
  close(): void;
}

interface SqlJsStatement {
  bind(params?: unknown[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): boolean;
}

// Load WASM once at module level
const SQL = await initSqlJs();

// --- Ergonomic wrapper over sql.js's low-level API ---

interface RunResult {
  changes: number;
}

class PreparedStatement {
  constructor(private wrapper: DatabaseWrapper, private sql: string) {}

  run(...params: unknown[]): RunResult {
    const stmt = this.wrapper.rawDb.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    stmt.step();
    stmt.free();
    const changes = this.wrapper.rawDb.getRowsModified();
    this.wrapper.persistIfNeeded();
    return { changes };
  }

  get(...params: unknown[]): Record<string, unknown> | undefined {
    const stmt = this.wrapper.rawDb.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    const result = stmt.step() ? stmt.getAsObject() : undefined;
    stmt.free();
    return result;
  }

  all(...params: unknown[]): Record<string, unknown>[] {
    const stmt = this.wrapper.rawDb.prepare(this.sql);
    if (params.length > 0) stmt.bind(params);
    const results: Record<string, unknown>[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
}

export class DatabaseWrapper {
  rawDb: SqlJsDatabase;
  private dbPath: string;
  private transactionDepth = 0;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    if (existsSync(dbPath)) {
      const buffer = readFileSync(dbPath);
      this.rawDb = new SQL.Database(buffer);
    } else {
      const dir = dirname(dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      this.rawDb = new SQL.Database();
    }
  }

  prepare(sql: string): PreparedStatement {
    return new PreparedStatement(this, sql);
  }

  exec(sql: string): void {
    this.rawDb.exec(sql);
    this.persistIfNeeded();
  }

  pragma(cmd: string, options?: { simple: true }): unknown {
    if (options?.simple) {
      const result = this.rawDb.exec(`PRAGMA ${cmd}`);
      if (result.length > 0 && result[0].values.length > 0) {
        return result[0].values[0][0];
      }
      return undefined;
    }
    this.rawDb.exec(`PRAGMA ${cmd}`);
    return undefined;
  }

  transaction<T>(fn: () => T): () => T {
    return () => {
      this.rawDb.run("BEGIN");
      this.transactionDepth++;
      try {
        const result = fn();
        this.transactionDepth--;
        this.rawDb.run("COMMIT");
        this.persistIfNeeded();
        return result;
      } catch (e) {
        this.transactionDepth--;
        this.rawDb.run("ROLLBACK");
        throw e;
      }
    };
  }

  persistIfNeeded(): void {
    if (this.transactionDepth === 0) {
      const data = this.rawDb.export();
      writeFileSync(this.dbPath, Buffer.from(data));
    }
  }

  close(): void {
    const data = this.rawDb.export();
    writeFileSync(this.dbPath, Buffer.from(data));
    this.rawDb.close();
  }
}

let db: DatabaseWrapper | null = null;

export function getDb(): DatabaseWrapper {
  if (db) return db;

  const dbPath = process.env.WHETSTONE_DB || ".whetstone/whetstone.db";
  db = new DatabaseWrapper(dbPath);

  // Run migrations with foreign keys off
  db.pragma("foreign_keys = OFF");
  runMigrations(db);
  db.pragma("foreign_keys = ON");

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
