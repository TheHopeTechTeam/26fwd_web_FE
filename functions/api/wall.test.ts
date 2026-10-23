import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../_lib/cards'
import { createTestDb, sqliteAvailable, type TestDb } from '../_test/d1'
import { onRequestPatch as hideCard } from './admin/cards/[id]/hide'
import { onRequestPatch as setCardStatus } from './admin/cards/[id]/status'
import { onRequestGet, WALL_CACHE_SECONDS } from './cards'

const HOST = '26fwd-staging.pages.dev'
const ADMIN_TOKEN = 'a'.repeat(32)
const NOW = Date.parse('2026-11-14T12:00:00Z')

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const envFor = (db: D1Database): Env => ({ FORWARD_DB: db, ADMIN_API_TOKEN: ADMIN_TOKEN })

// `count` cards with this status, newest last; returns their ids.
function insert({ query }: TestDb, status: string, count: number, prefix = status): string[] {
  return Array.from({ length: count }, (_, i) => {
    const id = `c_${prefix}_${i}`
    query(`INSERT INTO forward_cards VALUES (?, 'n', 'g', 'a', ?, 1, ?)`, id, status, new Date(NOW - 1_000_000 + i * 1000).toISOString())
    return id
  })
}

const approvedTotal = ({ query }: TestDb) => query('SELECT count FROM forward_card_counts')[0]?.count
const approvedCounted = ({ query }: TestDb) => query("SELECT COUNT(*) AS count FROM forward_cards WHERE status = 'approved'")[0]?.count

// Every statement the handler prepares, to see what it read.
function recording(db: D1Database) {
  const statements: string[] = []
  return { db: { prepare: (sql: string) => { statements.push(sql); return db.prepare(sql) } } as unknown as D1Database, statements }
}

type Wall = { items: { id: string }[]; pagination: { page: number; limit: number; has_more: boolean; total_count: number } }
const wallResponse = (env: Env, query = 'page=1&limit=12') => onRequestGet({ request: new Request(`https://${HOST}/api/cards?${query}`), env })
const wall = async (env: Env, query?: string) => (await wallResponse(env, query)).json() as Promise<Wall>

// Every page of the wall, the way Load More walks it.
async function wholeWall(env: Env) {
  const ids: string[] = []
  let page = 1, first: Wall | undefined
  for (;;) {
    const body = await wall(env, `page=${page}&limit=12`)
    first ??= body
    ids.push(...body.items.map(item => item.id))
    if (!body.pagination.has_more) return { total: first.pagination.total_count, ids }
    page++
  }
}

function admin(path: string, body?: unknown) {
  return new Request(`https://${HOST}/api/admin/cards/${path}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
const setStatus = (env: Env, id: string, status: 'approved' | 'hidden') =>
  setCardStatus({ request: admin(`${id}/status`, { status }), env, params: { id } })
const hide = (env: Env, id: string) => hideCard({ request: admin(`${id}/hide`), env, params: { id } })

// Stands in for caches.default: keeps a response until the max-age it was stored with runs out on
// the (fake) clock, as the Cache API honours Cache-Control.
function stubEdgeCache() {
  const entries = new Map<string, { response: Response; expires: number }>()
  vi.stubGlobal('caches', {
    default: {
      async match(request: Request) {
        const entry = entries.get(request.url)
        return entry && entry.expires > Date.now() ? entry.response.clone() : undefined
      },
      async put(request: Request, response: Response) {
        const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get('Cache-Control') ?? '')?.[1] ?? 0)
        entries.set(request.url, { response: response.clone(), expires: Date.now() + maxAge * 1000 })
      },
    },
  })
  return entries
}

describe.skipIf(!sqliteAvailable)('migration 0003: the approved total, kept by triggers', () => {
  it('starts from the cards already approved when it runs', () => {
    const t = createTestDb(['0001_initial.sql', '0002_client_token_rate_limits.sql'])
    insert(t, 'approved', 3)
    insert(t, 'pending', 2)
    insert(t, 'hidden', 1)
    t.migrate('0003_approved_card_count.sql')
    expect(approvedTotal(t)).toBe(3)
  })

  it('follows every change in and out of approved; other changes leave it alone', () => {
    const t = createTestDb()
    const [a, b] = insert(t, 'pending', 2)
    const steps: Array<[string, unknown[], number]> = [
      ["UPDATE forward_cards SET status = 'approved' WHERE id = ?", [a], 1],
      ["UPDATE forward_cards SET status = 'approved' WHERE id = ?", [b], 2],
      ["UPDATE forward_cards SET status = 'hidden' WHERE id = ?", [a], 1],
      ["UPDATE forward_cards SET status = 'hidden' WHERE id = ?", [a], 1],
      ["UPDATE forward_cards SET status = 'approved' WHERE id = ?", [a], 2],
      ["UPDATE forward_cards SET status = 'approved' WHERE id = ?", [a], 2],
      ["INSERT INTO forward_cards VALUES ('c_new', 'n', 'g', 'a', 'pending', 1, '2026-11-14T12:00:00.000Z')", [], 2],
      ["UPDATE forward_cards SET status = 'hidden' WHERE id = 'c_new'", [], 2],
      ["INSERT INTO forward_cards VALUES ('c_imported', 'n', 'g', 'a', 'approved', 1, '2026-11-14T12:00:01.000Z')", [], 3],
      ['DELETE FROM forward_cards WHERE id = ?', [b], 2],
      ["DELETE FROM forward_cards WHERE id = 'c_new'", [], 2],
    ]
    for (const [sql, params, expected] of steps) {
      t.query(sql, ...params)
      expect(approvedTotal(t), sql).toBe(expected)
      expect(approvedCounted(t)).toBe(expected)
    }
  })

  it('running it again recounts from the cards and keeps a single set of triggers', () => {
    const t = createTestDb()
    insert(t, 'approved', 4)
    t.query('UPDATE forward_card_counts SET count = 99')
    t.migrate('0003_approved_card_count.sql')
    expect(approvedTotal(t)).toBe(4)
    expect(t.query("SELECT COUNT(*) AS triggers FROM sqlite_master WHERE type = 'trigger'")[0]?.triggers).toBe(3)
    t.query("UPDATE forward_cards SET status = 'hidden' WHERE id = 'c_approved_0'")
    expect(approvedTotal(t)).toBe(3)
  })
})

describe.skipIf(!sqliteAvailable)('GET /api/cards', () => {
  it('regression (#5 D1 reads): reads the one-row total instead of counting every approved card', async () => {
    const t = createTestDb()
    insert(t, 'approved', 3)
    const { db, statements } = recording(t.db)
    expect((await wall(envFor(db))).pagination.total_count).toBe(3)
    expect(statements.some(sql => /COUNT\(/i.test(sql))).toBe(false)
    expect(statements.some(sql => /FROM forward_card_counts/.test(sql))).toBe(true)
  })

  it('full flow: after approving, hiding and re-publishing through the admin API, total_count matches the cards on the wall', async () => {
    const t = createTestDb()
    const env = envFor(t.db)
    const ids = insert(t, 'pending', 14)
    for (const id of ids.slice(0, 13)) expect((await setStatus(env, id, 'approved')).status).toBe(200)
    let seen = await wholeWall(env)
    expect(seen).toEqual({ total: 13, ids: ids.slice(0, 13).reverse() })

    expect((await hide(env, ids[0]!)).status).toBe(200)
    expect((await setStatus(env, ids[12]!, 'hidden')).status).toBe(200)
    seen = await wholeWall(env)
    expect(seen.total).toBe(11)
    expect(seen.ids).toHaveLength(11)
    expect(seen.ids).not.toContain(ids[0])
    expect(seen.ids).not.toContain(ids[12])

    expect((await setStatus(env, ids[0]!, 'approved')).status).toBe(200)
    seen = await wholeWall(env)
    expect(seen.total).toBe(12)
    expect(seen.ids).toHaveLength(12)
    expect(seen.ids.at(-1)).toBe(ids[0])
    expect(approvedCounted(t)).toBe(12)
  })

  it('a page past the last card is answered without reading the cards', async () => {
    const t = createTestDb()
    insert(t, 'approved', 3)
    const { db, statements } = recording(t.db)
    expect(await wall(envFor(db), 'page=2&limit=12')).toEqual({ items: [], pagination: { page: 2, limit: 12, has_more: false, total_count: 3 } })
    expect(statements).toHaveLength(1)
    expect(statements[0]).toMatch(/FROM forward_card_counts/)
  })

  it('counts instead, and logs it, while the total is missing', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const withoutTable = createTestDb(['0001_initial.sql', '0002_client_token_rate_limits.sql'])
    insert(withoutTable, 'approved', 2)
    expect((await wall(envFor(withoutTable.db))).pagination.total_count).toBe(2)

    const withoutRow = createTestDb()
    insert(withoutRow, 'approved', 5)
    withoutRow.query('DELETE FROM forward_card_counts')
    const body = await wall(envFor(withoutRow.db))
    expect(body.pagination.total_count).toBe(5)
    expect(body.items).toHaveLength(5)
    expect(error).toHaveBeenCalledTimes(2)
  })
})

describe.skipIf(!sqliteAvailable)('GET /api/cards: edge cache', () => {
  it(`serves a page from the edge cache for ${WALL_CACHE_SECONDS} s, then reads the database again`, async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    stubEdgeCache()
    const t = createTestDb()
    insert(t, 'approved', 2)
    const { db, statements } = recording(t.db)
    await wall(envFor(db))
    const reads = statements.length
    expect(reads).toBeGreaterThan(0)
    vi.setSystemTime(NOW + WALL_CACHE_SECONDS * 1000 - 1)
    expect((await wall(envFor(db))).items).toHaveLength(2)
    expect(statements).toHaveLength(reads)
    vi.setSystemTime(NOW + WALL_CACHE_SECONDS * 1000)
    await wall(envFor(db))
    expect(statements.length).toBeGreaterThan(reads)
  })

  it('a hidden card leaves the wall within 15 seconds of being hidden', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    stubEdgeCache()
    const t = createTestDb()
    const env = envFor(t.db)
    const [id] = insert(t, 'pending', 1)
    await setStatus(env, id!, 'approved')
    expect((await wall(env)).items.map(item => item.id)).toEqual([id])
    // The worst case: the page was cached the moment before the card was hidden.
    await hide(env, id!)
    vi.setSystemTime(NOW + WALL_CACHE_SECONDS * 1000 - 1)
    expect((await wall(env)).items).toHaveLength(1)
    vi.setSystemTime(NOW + WALL_CACHE_SECONDS * 1000)
    expect(await wall(env)).toMatchObject({ items: [], pagination: { total_count: 0 } })
    expect(WALL_CACHE_SECONDS).toBeLessThan(15)
  })

  it('browsers are told to revalidate every time, so their copy cannot outlast the edge one', async () => {
    const entries = stubEdgeCache()
    const t = createTestDb()
    insert(t, 'approved', 1)
    const miss = await wallResponse(envFor(t.db))
    const hit = await wallResponse(envFor(t.db))
    for (const response of [miss, hit]) expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate')
    expect([...entries.values()][0]?.response.headers.get('Cache-Control')).toBe(`public, max-age=${WALL_CACHE_SECONDS}`)
  })

  it('other query parameters share the page\'s entry instead of bypassing the cache', async () => {
    stubEdgeCache()
    const t = createTestDb()
    insert(t, 'approved', 1)
    const { db, statements } = recording(t.db)
    await wall(envFor(db), 'page=1&limit=12')
    const reads = statements.length
    for (const query of ['page=1&limit=12&nocache=1', 'limit=12&page=1', 'page=01&limit=12']) await wall(envFor(db), query)
    expect(statements).toHaveLength(reads)
  })

  it('a failing cache never fails the wall', async () => {
    vi.stubGlobal('caches', { default: { match: () => Promise.reject(new Error('cache down')), put: () => Promise.reject(new Error('cache down')) } })
    const t = createTestDb()
    insert(t, 'approved', 2)
    const response = await wallResponse(envFor(t.db))
    expect(response.status).toBe(200)
    expect(((await response.json()) as Wall).pagination.total_count).toBe(2)
  })
})
