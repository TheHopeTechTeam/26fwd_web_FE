import { ApiError } from './cards'

// Client Token (#5): an anonymous token the server signs, so that people sharing one public IP
// (a venue wifi, a mobile carrier NAT) each get their own submission quota. It carries no user
// data and is not an identity; Turnstile and the per-IP limits are what stop automated floods.
//   format: v1.<random id>.<expiry, Unix seconds>.<HMAC-SHA256 of everything before it>
// It lives in an HttpOnly cookie that the page's JavaScript cannot read. Changing
// CLIENT_TOKEN_SECRET invalidates every token at once; browsers then fetch a new one.
export const CLIENT_TOKEN_COOKIE = '__Host-fwd_ct'
export const CLIENT_TOKEN_TTL_SECONDS = 7200

const SECRET_MIN_LENGTH = 32
const TOKEN_PATTERN = /^v1\.([A-Za-z0-9_-]{22})\.(\d{10})\.([A-Za-z0-9_-]{43})$/
const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  return Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0))
}

async function signingKey(secret?: string): Promise<CryptoKey> {
  if (!secret || secret.length < SECRET_MIN_LENGTH) throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Client token secret is not securely configured')
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

function readCookie(request: Request, name: string): string | undefined {
  for (const pair of request.headers.get('Cookie')?.split(';') ?? []) {
    const separator = pair.indexOf('=')
    if (separator !== -1 && pair.slice(0, separator).trim() === name) return pair.slice(separator + 1).trim()
  }
  return undefined
}

export async function issueClientToken(secret: string | undefined, now: number): Promise<string> {
  const key = await signingKey(secret)
  const payload = `v1.${toBase64Url(crypto.getRandomValues(new Uint8Array(16)))}.${Math.floor(now / 1000) + CLIENT_TOKEN_TTL_SECONDS}`
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
  return `${payload}.${toBase64Url(signature)}`
}

// The token's random id when the request carries an unexpired token this server signed; otherwise null.
export async function readClientToken(request: Request, secret: string | undefined, now: number): Promise<string | null> {
  const key = await signingKey(secret)
  const match = TOKEN_PATTERN.exec(readCookie(request, CLIENT_TOKEN_COOKIE) ?? '')
  if (!match) return null
  const [, id = '', expires = '', signature = ''] = match
  const genuine = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), encoder.encode(`v1.${id}.${expires}`))
  return genuine && Number(expires) > Math.floor(now / 1000) ? id : null
}

export async function requireClientToken(request: Request, secret: string | undefined, now: number): Promise<string> {
  const id = await readClientToken(request, secret, now)
  if (!id) throw new ApiError(401, 'CLIENT_TOKEN_INVALID', 'Missing, expired or invalid client token')
  return id
}

// __Host- requires Secure and Path=/ and forbids Domain, so no other thehope.co subdomain can
// plant or overwrite this cookie. SameSite=Strict keeps it off requests started by other sites.
export const clientTokenCookie = (token: string) =>
  `${CLIENT_TOKEN_COOKIE}=${token}; Max-Age=${CLIENT_TOKEN_TTL_SECONDS}; Path=/; Secure; HttpOnly; SameSite=Strict`
