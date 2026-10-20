// Keeps every file the trial tools read or write inside the private data checkout, and that
// checkout outside this public repo, so test cards and results can never land in a public commit
// (#5, #29 review). Paths are compared after resolving symlinks.
import { existsSync, mkdirSync, realpathSync, statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PUBLIC_REPO = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '../..'))

export function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

const inside = (parent, child) => {
  const path = relative(parent, child)
  return path === '' || (!path.startsWith('..') && !isAbsolute(path))
}

// --data: an existing folder outside this public repo (the private repo checkout).
export function privateDataDir(arg) {
  if (!arg) fail('--data must point to a checkout of the private repo 26fwd-moderation-eval')
  const path = resolve(arg)
  if (!existsSync(path) || !statSync(path).isDirectory()) fail(`--data ${path} is not a folder`)
  const real = realpathSync(path)
  if (inside(PUBLIC_REPO, real)) fail(`--data ${real} is inside the public repo; use the private checkout instead`)
  return real
}

// A file to read (--cards, --questions, results): a relative path that stays inside --data.
export function dataFile(data, name, option) {
  if (!name || isAbsolute(name)) fail(`${option} must be a path relative to --data`)
  const path = resolve(data, name)
  if (!existsSync(path)) fail(`${option} ${name} was not found in ${data}`)
  const real = realpathSync(path)
  if (real === data || !inside(data, real)) fail(`${option} ${name} points outside ${data}`)
  return real
}

// --tag becomes part of a file name, so it may only use plain characters.
export function checkTag(tag) {
  if (tag !== undefined && !/^[A-Za-z0-9][\w.-]{0,40}$/.test(tag)) fail('--tag may only contain letters, digits, ".", "_" and "-", starting with a letter or digit')
  return tag ? `-${tag}` : ''
}

// Where results are written (created if needed); it must resolve inside --data, so a symlinked
// folder cannot redirect the output. The deepest folder that already exists is checked first,
// so nothing is created outside --data either.
export function resultsDir(data, sub) {
  const path = resolve(data, sub)
  const allowed = (real) => inside(data, real) && !inside(PUBLIC_REPO, real)
  let existing = path
  while (!existsSync(existing)) existing = dirname(existing)
  if (!allowed(realpathSync(existing))) fail(`results folder ${path} resolves outside ${data}`)
  mkdirSync(path, { recursive: true })
  const real = realpathSync(path)
  if (!allowed(real)) fail(`results folder ${real} is not inside ${data}`)
  return real
}
