// Duck-typed interface matching the subset of DatabaseWrapper used by migrations
interface MigrationDb {
  exec(sql: string): void;
  pragma(cmd: string, options?: { simple: true }): unknown;
  transaction<T>(fn: () => T): () => T;
}

export type Migration = (db: MigrationDb) => void;

/**
 * Ordered array of schema migrations.
 * Index 0 = migration from version 0 → 1, index 1 = 1 → 2, etc.
 *
 * Rules:
 * - NEVER remove, reorder, or modify existing migrations
 * - ALWAYS append new migrations to the end of this array
 * - Migration 0→1 uses IF NOT EXISTS for backward compat with pre-migration dbs
 * - All subsequent migrations use direct DDL
 */
export const migrations: Migration[] = [
  // 0 → 1: Initial schema (idempotent for existing databases)
  (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS rejections (
        id              TEXT PRIMARY KEY,
        domain          TEXT NOT NULL,
        description     TEXT NOT NULL,
        reasoning       TEXT,
        raw_output      TEXT,
        constraint_id   TEXT,
        created_at      TEXT NOT NULL,
        FOREIGN KEY (constraint_id) REFERENCES constraints(id)
      );

      CREATE TABLE IF NOT EXISTS constraints (
        id              TEXT PRIMARY KEY,
        domain          TEXT NOT NULL,
        category        TEXT NOT NULL,
        title           TEXT NOT NULL,
        rule            TEXT NOT NULL,
        reasoning       TEXT,
        rejected_example TEXT,
        accepted_example TEXT,
        tags            TEXT,
        severity        TEXT NOT NULL DEFAULT 'important',
        status          TEXT NOT NULL DEFAULT 'active',
        source          TEXT,
        times_applied   INTEGER NOT NULL DEFAULT 0,
        last_applied_at TEXT,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_rejections_domain ON rejections(domain);
      CREATE INDEX IF NOT EXISTS idx_constraints_domain ON constraints(domain);
      CREATE INDEX IF NOT EXISTS idx_constraints_status ON constraints(status);
    `);
  },
];

export function runMigrations(db: MigrationDb): void {
  const currentVersion = (db.pragma("user_version", { simple: true }) as number) ?? 0;
  const targetVersion = migrations.length;

  if (currentVersion >= targetVersion) {
    if (currentVersion > targetVersion) {
      process.stderr.write(
        `whetstone: database is version ${currentVersion}, code supports up to ${targetVersion}. Skipping migrations (possible downgrade).\n`
      );
    }
    return;
  }

  process.stderr.write(
    `whetstone: migrating database from version ${currentVersion} to ${targetVersion}\n`
  );

  for (let i = currentVersion; i < targetVersion; i++) {
    const migration = migrations[i];
    const fromVersion = i;
    const toVersion = i + 1;

    const runInTransaction = db.transaction(() => {
      migration(db);
      db.pragma(`user_version = ${toVersion}`);
    });

    runInTransaction();
    process.stderr.write(`whetstone: applied migration ${fromVersion} → ${toVersion}\n`);
  }
}
