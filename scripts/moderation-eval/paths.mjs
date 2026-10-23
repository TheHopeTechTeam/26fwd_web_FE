// Keeps every file the trial tools read or write inside the private data checkout, and that
// checkout outside this public repo, so test cards and results can never land in a public commit
// (#5, #29 review). Paths are compared after resolving symlinks.
import { closeSync, constants, existsSync, fstatSync, lstatSync, mkdirSync, openSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
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

const NO_FOLLOW = constants.O_NOFOLLOW ?? 0

function existing(path) {
  try {
    return lstatSync(path)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

// The folder check above cannot stop the results file itself from leading elsewhere: a symlink,
// even a dangling one, or a hard link shared with a file outside --data, such as one in this public
// repo, would take the write with it (#29 review). So a results file must be a plain file with no
// other name.
function refuseLinked(path, stats) {
  if (stats.isSymbolicLink()) fail(`results file ${path} is a symlink; results are only written to plain files inside --data`)
  if (!stats.isFile()) fail(`results file ${path} is not a regular file`)
  if (stats.nlink > 1) fail(`results file ${path} has another hard link; results are only written to plain files inside --data`)
}

// <dir>/<name> for a folder from resultsDir, refused if it already exists as anything but a plain file.
export function resultsFile(dir, name) {
  const path = resolve(dir, name)
  if (dirname(path) !== dir) fail(`results file name ${name} must not contain a folder`)
  const stats = existing(path)
  if (stats) refuseLinked(path, stats)
  return path
}

// Opens a results log to read what it holds and to append to it. Opening does not follow a
// symlink, and the open file is checked again, so nothing can be swapped in after resultsFile.
export function openResultsLog(path) {
  let fd
  try {
    fd = openSync(path, constants.O_RDWR | constants.O_APPEND | constants.O_CREAT | NO_FOLLOW, 0o644)
  } catch (error) {
    fail(`cannot open results file ${path}: ${error.code ?? error.message}`)
  }
  refuseLinked(path, fstatSync(fd))
  return fd
}

// Replaces a results file in one step: the text goes to a new file beside it, renamed over it. A
// rename replaces the name itself, never the file a symlink or another hard link leads to.
export function writeResultsFile(path, text) {
  const temp = `${path}.${process.pid}.tmp`
  const fd = openSync(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NO_FOLLOW, 0o644)
  try {
    try {
      writeFileSync(fd, text)
    } finally {
      closeSync(fd)
    }
    renameSync(temp, path)
  } catch (error) {
    rmSync(temp, { force: true })
    throw error
  }
}
