import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NOINDEX, siteIndexingHeaders } from './site-indexing.mjs'

const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8')

// Each rule in a _headers file: its URL pattern and the header lines under it.
function rules(text) {
  const result = []
  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.startsWith('#')) continue
    if (/^\s/.test(line)) result.at(-1).lines.push(line.trim())
    else result.push({ pattern: line, lines: [] })
  }
  return result
}

describe('site indexing (#36)', () => {
  it('keeps every address out of search engines unless the build asks for exactly "allow"', () => {
    expect(rules(headers).find((r) => r.pattern === '/*').lines).toContain(NOINDEX)
    for (const mode of [undefined, '', 'noindex', 'ALLOW', 'true', 'allow ']) {
      expect(siteIndexingHeaders(headers, mode)).toBe(headers)
    }
  })

  it('a launch build lets only the custom domain be indexed: pages.dev addresses and /admin/ stay out', () => {
    const launch = rules(siteIndexingHeaders(headers, 'allow'))
    const all = launch.find((r) => r.pattern === '/*')
    expect(all.lines).not.toContain(NOINDEX)
    // Every other header of the catch-all rule is untouched.
    expect(all.lines).toEqual(rules(headers).find((r) => r.pattern === '/*').lines.filter((l) => l !== NOINDEX))
    expect(launch.filter((r) => r.lines.includes(NOINDEX)).map((r) => r.pattern)).toEqual([
      'https://:project.pages.dev/*',
      'https://:version.:project.pages.dev/*',
      '/admin/*',
    ])
  })

  it('fails the build instead of guessing when public/_headers no longer has the line it drops', () => {
    expect(() => siteIndexingHeaders('/*\n  X-Frame-Options: DENY\n', 'allow')).toThrow(/no "X-Robots-Tag/)
  })
})
