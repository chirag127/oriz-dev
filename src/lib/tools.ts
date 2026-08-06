/** Pure dev-tool logic. No DOM, no I/O — unit-testable. */

// ---------- JSON ----------
export interface JsonResult {
  ok: boolean
  output: string
  error: string
}

export function formatJson(input: string, indent = 2): JsonResult {
  if (!input.trim()) return { ok: false, output: '', error: 'empty input' }
  try {
    const parsed = JSON.parse(input)
    return { ok: true, output: JSON.stringify(parsed, null, indent), error: '' }
  } catch (e) {
    return { ok: false, output: '', error: (e as Error).message }
  }
}

export function minifyJson(input: string): JsonResult {
  if (!input.trim()) return { ok: false, output: '', error: 'empty input' }
  try {
    return { ok: true, output: JSON.stringify(JSON.parse(input)), error: '' }
  } catch (e) {
    return { ok: false, output: '', error: (e as Error).message }
  }
}

// ---------- Base64 ----------
/** UTF-8 safe base64 encode (browser btoa is latin1-only). */
export function b64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export function b64Decode(input: string): JsonResult {
  try {
    const bin = atob(input.trim())
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return { ok: true, output: new TextDecoder().decode(bytes), error: '' }
  } catch (e) {
    return { ok: false, output: '', error: 'invalid base64: ' + (e as Error).message }
  }
}

// ---------- URL ----------
export function urlEncode(input: string): string {
  return encodeURIComponent(input)
}
export function urlDecode(input: string): JsonResult {
  try {
    return { ok: true, output: decodeURIComponent(input), error: '' }
  } catch (e) {
    return { ok: false, output: '', error: (e as Error).message }
  }
}

// ---------- JWT ----------
export interface JwtParts {
  ok: boolean
  header: string
  payload: string
  signature: string
  error: string
  expNote: string
}

function b64urlToStr(seg: string): string {
  const pad = seg.length % 4 === 0 ? '' : '='.repeat(4 - (seg.length % 4))
  const b64 = seg.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function decodeJwt(token: string): JwtParts {
  const empty = { ok: false, header: '', payload: '', signature: '', error: '', expNote: '' }
  const parts = token.trim().split('.')
  if (parts.length !== 3) return { ...empty, error: 'not a JWT: expected 3 dot-separated segments' }
  try {
    const header = JSON.stringify(JSON.parse(b64urlToStr(parts[0])), null, 2)
    const payloadObj = JSON.parse(b64urlToStr(parts[1]))
    const payload = JSON.stringify(payloadObj, null, 2)
    let expNote = ''
    if (typeof payloadObj.exp === 'number') {
      const expMs = payloadObj.exp * 1000
      expNote =
        expMs < Date.now()
          ? `expired ${new Date(expMs).toISOString()}`
          : `valid until ${new Date(expMs).toISOString()}`
    }
    return { ok: true, header, payload, signature: parts[2], error: '', expNote }
  } catch (e) {
    return { ...empty, error: 'decode failed: ' + (e as Error).message }
  }
}

// ---------- UUID ----------
export function newUuid(): string {
  return crypto.randomUUID()
}
export function newUuids(n: number): string[] {
  const out: string[] = []
  for (let i = 0; i < Math.max(1, Math.min(n, 1000)); i++) out.push(crypto.randomUUID())
  return out
}

// ---------- Timestamp ----------
export interface TimeView {
  epochSec: number
  epochMs: number
  iso: string
  utc: string
  local: string
  relative: string
}

export function relativeTime(fromMs: number, nowMs = Date.now()): string {
  const diff = fromMs - nowMs
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536e6],
    ['month', 2628e6],
    ['day', 864e5],
    ['hour', 36e5],
    ['minute', 6e4],
    ['second', 1e3],
  ]
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'second') return rtf.format(Math.round(diff / ms), unit)
  }
  return 'now'
}

export function timeFromEpoch(input: string): { ok: boolean; view?: TimeView; error: string } {
  const t = input.trim()
  if (!t) return { ok: false, error: 'empty' }
  let ms: number
  if (/^\d+$/.test(t)) {
    // digits: 10 → seconds, 13 → ms
    ms = t.length <= 10 ? Number(t) * 1000 : Number(t)
  } else {
    ms = Date.parse(t)
    if (Number.isNaN(ms)) return { ok: false, error: 'unparseable date/time' }
  }
  const d = new Date(ms)
  return {
    ok: true,
    error: '',
    view: {
      epochSec: Math.floor(ms / 1000),
      epochMs: ms,
      iso: d.toISOString(),
      utc: d.toUTCString(),
      local: d.toLocaleString(),
      relative: relativeTime(ms),
    },
  }
}

// ---------- Diff (line-level LCS) ----------
export type DiffOp = { type: 'eq' | 'add' | 'del'; line: string }

export function lineDiff(a: string, b: string): DiffOp[] {
  const A = a.split('\n')
  const B = b.split('\n')
  const n = A.length
  const m = B.length
  // LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ops: DiffOp[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      ops.push({ type: 'eq', line: A[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'del', line: A[i] })
      i++
    } else {
      ops.push({ type: 'add', line: B[j] })
      j++
    }
  }
  while (i < n) ops.push({ type: 'del', line: A[i++] })
  while (j < m) ops.push({ type: 'add', line: B[j++] })
  return ops
}

// ---------- Regex ----------
export interface RegexMatch {
  match: string
  index: number
  groups: string[]
  named: Record<string, string>
}
export interface RegexResult {
  ok: boolean
  matches: RegexMatch[]
  error: string
}

export function runRegex(pattern: string, flags: string, text: string): RegexResult {
  if (!pattern) return { ok: false, matches: [], error: 'empty pattern' }
  let re: RegExp
  try {
    const f = flags.includes('g') ? flags : flags + 'g'
    re = new RegExp(pattern, f)
  } catch (e) {
    return { ok: false, matches: [], error: (e as Error).message }
  }
  const out: RegexMatch[] = []
  let m: RegExpExecArray | null
  let guard = 0
  while ((m = re.exec(text)) !== null) {
    out.push({
      match: m[0],
      index: m.index,
      groups: m.slice(1).map((g) => g ?? ''),
      named: { ...(m.groups ?? {}) } as Record<string, string>,
    })
    if (m[0] === '') re.lastIndex++
    if (++guard > 100000) break
  }
  return { ok: true, matches: out, error: '' }
}
