import { describe, expect, it } from 'vitest'
import {
  b64Decode,
  b64Encode,
  decodeJwt,
  formatJson,
  lineDiff,
  minifyJson,
  newUuids,
  relativeTime,
  runRegex,
  timeFromEpoch,
  urlDecode,
  urlEncode,
} from '../src/lib/tools'

describe('json', () => {
  it('formats valid json', () => {
    const r = formatJson('{"a":1}')
    expect(r.ok).toBe(true)
    expect(r.output).toBe('{\n  "a": 1\n}')
  })
  it('reports errors', () => {
    expect(formatJson('{bad}').ok).toBe(false)
  })
  it('minifies', () => {
    expect(minifyJson('{ "a": 1 }').output).toBe('{"a":1}')
  })
  it('empty input', () => {
    expect(formatJson('   ').error).toBe('empty input')
  })
})

describe('base64', () => {
  it('round-trips utf-8', () => {
    const enc = b64Encode('héllo → 世界')
    expect(b64Decode(enc).output).toBe('héllo → 世界')
  })
  it('bad base64 errors', () => {
    expect(b64Decode('!!!not b64!!!').ok).toBe(false)
  })
})

describe('url', () => {
  it('encodes', () => expect(urlEncode('a b&c')).toBe('a%20b%26c'))
  it('decodes', () => expect(urlDecode('a%20b%26c').output).toBe('a b&c'))
  it('bad percent errors', () => expect(urlDecode('%').ok).toBe(false))
})

describe('jwt', () => {
  // HS256 {"alg":"HS256","typ":"JWT"} . {"sub":"42","exp":9999999999} . sig
  const tok =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsImV4cCI6OTk5OTk5OTk5OX0.abc'
  it('decodes 3 segments', () => {
    const r = decodeJwt(tok)
    expect(r.ok).toBe(true)
    expect(r.header).toContain('HS256')
    expect(r.payload).toContain('"sub": "42"')
    expect(r.expNote).toContain('valid until')
  })
  it('flags expired', () => {
    const past =
      'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjF9.x' // exp:1 (1970)
    expect(decodeJwt(past).expNote).toContain('expired')
  })
  it('rejects non-jwt', () => {
    expect(decodeJwt('nope').ok).toBe(false)
  })
})

describe('uuid', () => {
  it('generates n valid v4', () => {
    const ids = newUuids(3)
    expect(ids).toHaveLength(3)
    for (const id of ids)
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
  it('caps count', () => {
    expect(newUuids(99999).length).toBe(1000)
    expect(newUuids(0).length).toBe(1)
  })
})

describe('time', () => {
  it('parses 10-digit epoch as seconds', () => {
    const r = timeFromEpoch('0')
    expect(r.view?.iso).toBe('1970-01-01T00:00:00.000Z')
  })
  it('parses ms epoch', () => {
    const r = timeFromEpoch('1000000000000')
    expect(r.view?.epochMs).toBe(1000000000000)
  })
  it('parses iso string', () => {
    const r = timeFromEpoch('2025-01-01T00:00:00Z')
    expect(r.view?.epochSec).toBe(1735689600)
  })
  it('rejects garbage', () => {
    expect(timeFromEpoch('not-a-date').ok).toBe(false)
  })
  it('relative future', () => {
    expect(relativeTime(Date.now() + 3 * 864e5)).toMatch(/day/)
  })
})

describe('diff', () => {
  it('detects add/del/eq', () => {
    const ops = lineDiff('a\nb\nc', 'a\nx\nc')
    expect(ops).toEqual([
      { type: 'eq', line: 'a' },
      { type: 'del', line: 'b' },
      { type: 'add', line: 'x' },
      { type: 'eq', line: 'c' },
    ])
  })
  it('all-equal', () => {
    expect(lineDiff('same', 'same').every((o) => o.type === 'eq')).toBe(true)
  })
})

describe('regex', () => {
  it('finds matches with groups', () => {
    const r = runRegex('(\\w)(\\d)', 'gi', 'a1 b2')
    expect(r.matches).toHaveLength(2)
    expect(r.matches[0].groups).toEqual(['a', '1'])
  })
  it('named groups', () => {
    const r = runRegex('(?<y>\\d{4})', 'g', '2025')
    expect(r.matches[0].named.y).toBe('2025')
  })
  it('invalid pattern errors', () => {
    expect(runRegex('(', '', 'x').ok).toBe(false)
  })
  it('empty pattern', () => {
    expect(runRegex('', '', 'x').ok).toBe(false)
  })
  it('handles zero-width without hang', () => {
    const r = runRegex('a*', 'g', 'aaa')
    expect(r.ok).toBe(true)
  })
})
