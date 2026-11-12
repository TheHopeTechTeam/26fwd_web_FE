import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { siteIndexingHeaders } from './site-indexing.mjs'

const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8')

// Each rule in a _headers file: its URL pattern, the headers it detaches (`! name`) and sets.
function rules(text) {
  const result = []
  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.startsWith('#')) continue
    if (!/^\s/.test(line)) {
      result.push({ pattern: line.trim(), unset: [], set: [] })
      continue
    }
    const entry = line.trim()
    if (entry.startsWith('!')) result.at(-1).unset.push(entry.slice(1).trim().toLowerCase())
    else {
      const colon = entry.indexOf(':')
      result.at(-1).set.push([entry.slice(0, colon).trim().toLowerCase(), entry.slice(colon + 1).trim()])
    }
  }
  return result
}

// The headers a path on the custom domain gets, the way Cloudflare's shared asset code (the same
// code `wrangler pages dev` runs) applies a _headers file:
// - rules are kept per pattern, so a later rule with the same pattern replaces the earlier one;
// - every matching rule applies in file order: first its detached headers are removed, then its
//   own are set, joined with a comma to one an earlier rule set.
function headersFor(path, text) {
  const kept = new Map()
  for (const rule of rules(text)) kept.set(rule.pattern, rule)
  const result = new Map()
  const setByRules = new Set()
  for (const rule of kept.values()) {
    if (rule.pattern.startsWith('https://')) continue // the pages.dev addresses
    const pattern = new RegExp(`^${rule.pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`)
    if (!pattern.test(path)) continue
    for (const name of rule.unset) result.delete(name)
    for (const [name, value] of rule.set) {
      if (setByRules.has(name) && result.has(name)) result.set(name, `${result.get(name)}, ${value}`)
      else result.set(name, value)
      setByRules.add(name)
    }
  }
  return result
}

const directives = (policy) => policy.split(';').map((d) => d.trim().split(/\s+/))
const CSP = 'content-security-policy'

describe('the review console CSP (#67)', () => {
  const site = headersFor('/', headers).get(CSP)
  const admin = headersFor('/admin/', headers).get(CSP)

  it('is the site policy without any https source', () => {
    expect(site).toContain('https://www.googletagmanager.com')
    const expected = directives(site).map(([name, ...sources]) => {
      const kept = sources.filter((s) => !/^https?:/.test(s))
      return sources.length && !kept.length ? [name, "'none'"] : [name, ...kept]
    })
    expect(directives(admin)).toEqual(expected)
    expect(directives(admin).find(([name]) => name === 'script-src')).toEqual(['script-src', "'self'"])
    expect(admin).not.toMatch(/https?:|\*/)
  })

  it('replaces the site policy instead of joining it', () => {
    expect(admin).not.toContain(',')
    expect(headersFor('/admin/index.html', headers).get(CSP)).toBe(admin)
    // The public pages keep the site policy, with GA4, Turnstile and YouTube.
    for (const path of ['/', '/cards/', '/privacy/', '/assets/main.js']) expect(headersFor(path, headers).get(CSP)).toBe(site)
  })

  it('stays the same in a launch build, where /admin/ still keeps search engines out', () => {
    const launch = siteIndexingHeaders(headers, 'allow')
    expect(headersFor('/admin/', launch).get(CSP)).toBe(admin)
    expect(headersFor('/', launch).get(CSP)).toBe(site)
    expect(headersFor('/admin/', launch).get('x-robots-tag')).toBe('noindex, nofollow, noarchive')
    expect(headersFor('/', launch).has('x-robots-tag')).toBe(false)
  })

  it('never has two rules for one pattern, which would drop the first, in either build', () => {
    for (const text of [headers, siteIndexingHeaders(headers, 'allow')]) {
      const patterns = rules(text).map((r) => r.pattern)
      expect(patterns.filter((p, i) => patterns.indexOf(p) !== i)).toEqual([])
    }
  })

  it('keeps every other site header on /admin/', () => {
    const others = (path) => [...headersFor(path, headers)].filter(([name]) => name !== CSP)
    expect(others('/admin/')).toEqual(others('/'))
  })
})
