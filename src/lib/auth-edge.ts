/**
 * Edge-compatible session token verification.
 *
 * The main auth.ts uses Node's `crypto` module (for HMAC), which is NOT
 * available in the Edge Runtime (where middleware runs). This file provides
 * a pure-JS implementation of the same HMAC-SHA256 verification using
 * Web Crypto API (crypto.subtle), which IS available in Edge.
 *
 * Both implementations produce identical HMAC-SHA256 signatures, so tokens
 * signed in Node (auth.ts) verify correctly here, and vice versa.
 */

/** Verify a session token without Node's crypto module (Edge-compatible). */
export async function verifySessionTokenEdge(
  token: string | undefined,
): Promise<{ userId: string; role: string; iat: number; exp: number } | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const data = `${header}.${body}`

  const secret = getSecret()
  const expectedSig = await hmacBase64Url(secret, data)

  // constant-time-ish compare
  if (sig.length !== expectedSig.length) return null
  let mismatch = 0
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i)
  }
  if (mismatch !== 0) return null

  try {
    const decoded = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
    if (decoded.exp && Date.now() > decoded.exp) return null
    return decoded
  } catch {
    return null
  }
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET must be set in production')
    }
    return 'dev-secret-change-me'
  }
  return secret
}

async function hmacBase64Url(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  // Convert ArrayBuffer to base64url
  const bytes = new Uint8Array(sig)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const SESSION_COOKIE_NAME = 'manhal_session'
