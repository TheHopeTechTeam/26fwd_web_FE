// Whether search engines may index the site (#36), decided per build.
//
// public/_headers keeps every address out of search engines, so any build that does not ask
// otherwise (staging, previews, the GitHub Pages demo) stays out. A build with SITE_INDEXING=allow,
// meant only for the production launch, drops that header from the catch-all rule and keeps it on
// the pages.dev addresses (staging, the production project's own address and every per-deployment
// preview) and on the admin page, so only the custom domain can be indexed.

export const NOINDEX = 'X-Robots-Tag: noindex, nofollow, noarchive'

// Cloudflare's documented rules for keeping *.pages.dev and *.*.pages.dev out of search results.
// /admin/ also carries its own robots meta tag.
const STILL_NOINDEX = ['https://:project.pages.dev/*', 'https://:version.:project.pages.dev/*', '/admin/*']

export function siteIndexingHeaders(headers, mode) {
  if (mode !== 'allow') return headers
  const lines = headers.split('\n')
  const index = lines.indexOf(`  ${NOINDEX}`)
  if (index === -1) throw new Error(`public/_headers has no "${NOINDEX}" line to drop; update scripts/site-indexing.mjs`)
  lines.splice(index, 1)
  const rules = STILL_NOINDEX.map((pattern) => `${pattern}\n  ${NOINDEX}\n`).join('\n')
  return `${lines.join('\n').trimEnd()}\n\n${rules}`
}
