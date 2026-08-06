/** Web Crypto hashing. Browser-only (crypto.subtle). */

export type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

export const HASH_ALGOS: HashAlgo[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashText(algo: HashAlgo, text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest(algo, data)
  return toHex(digest)
}

export async function hashBuffer(algo: HashAlgo, buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest(algo, buf)
  return toHex(digest)
}
