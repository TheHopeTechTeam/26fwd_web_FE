// Test-only D1 stand-in on Node's built-in SQLite (node:sqlite, Node 22.13 or later), so the
// limiter SQL runs on a real SQLite engine against the real migrations instead of a fake that
// only records calls. The Node modules are imported by a computed name because this folder is
// typechecked with the Workers types, which have no Node types.

type SqliteStatement = {
  run(...params: unknown[]): { changes: number | bigint }
  all(...params: unknown[]): unknown[]
  get(...params: unknown[]): unknown
}
type SqliteDatabase = { exec(sql: string): void; prepare(sql: string): SqliteStatement }
type NodeModules = {
  sqlite: { DatabaseSync: new (location: string) => SqliteDatabase }
  fs: { readdirSync(path: URL): string[]; readFileSync(path: URL, encoding: 'utf8'): string }
}

const load = (name: string): Promise<unknown> => import(/* @vite-ignore */ name)
const modules = await Promise.all([load('node:sqlite'), load('node:fs')])
  .then(([sqlite, fs]) => ({ sqlite, fs }) as NodeModules)
  .catch(() => null)

/** False on Node versions without node:sqlite; tests that need a database skip themselves. */
export const sqliteAvailable = modules !== null

// A file URL under vitest; the Workers types do not declare import.meta.url.
const MIGRATIONS = new URL('../../migrations/', (import.meta as unknown as { url: string }).url)

export function migrationNames(): string[] {
  return requireModules().fs.readdirSync(MIGRATIONS).filter(name => name.endsWith('.sql')).sort()
}

export type TestDb = {
  db: D1Database
  /** Runs SQL directly, to arrange state or check what was written. */
  query: (sql: string, ...params: unknown[]) => Record<string, unknown>[]
  migrate: (name: string) => void
}

/** A fresh in-memory database with the given migrations applied (all of them by default). */
export function createTestDb(migrations = migrationNames()): TestDb {
  const { sqlite, fs } = requireModules()
  const database = new sqlite.DatabaseSync(':memory:')
  const migrate = (name: string) => database.exec(fs.readFileSync(new URL(name, MIGRATIONS), 'utf8'))
  migrations.forEach(migrate)
  return {
    db: asD1(database),
    query: (sql, ...params) => database.prepare(sql).all(...params) as Record<string, unknown>[],
    migrate,
  }
}

function requireModules(): NodeModules {
  if (!modules) throw new Error('node:sqlite is unavailable; run the tests on Node 22.13 or later')
  return modules
}

// Only the D1 calls the functions use: prepare().bind() then run(), all() or first(), and batch().
function asD1(database: SqliteDatabase): D1Database {
  return {
    prepare(sql: string) {
      let params: unknown[] = []
      const statement = {
        bind(...values: unknown[]) { params = values; return statement },
        // meta.changes as D1 reports it: the admin endpoints answer 404 when nothing changed.
        async run() { return { success: true, meta: { changes: Number(database.prepare(sql).run(...params).changes) }, results: [] } },
        async all() { return { success: true, meta: {}, results: database.prepare(sql).all(...params) } },
        async first() { return database.prepare(sql).get(...params) ?? null },
      }
      return statement
    },
    // Like D1, a batch runs as one transaction on one connection, so changes() in a statement sees
    // the statement before it, and a failure rolls the whole batch back.
    async batch(statements: Array<{ all(): Promise<unknown> }>) {
      database.exec('BEGIN')
      try {
        const results = []
        for (const statement of statements) results.push(await statement.all())
        database.exec('COMMIT')
        return results
      } catch (error) {
        database.exec('ROLLBACK')
        throw error
      }
    },
  } as unknown as D1Database
}
