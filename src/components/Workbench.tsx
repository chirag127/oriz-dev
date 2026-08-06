import { useEffect, useMemo, useRef, useState } from 'react'
import AiExplain from './AiExplain'
import { explainCron } from '../lib/cron'
import { HASH_ALGOS, type HashAlgo, hashBuffer, hashText } from '../lib/hash'
import {
  b64Decode,
  b64Encode,
  decodeJwt,
  formatJson,
  lineDiff,
  minifyJson,
  newUuids,
  runRegex,
  timeFromEpoch,
  urlDecode,
  urlEncode,
} from '../lib/tools'

type ToolId =
  | 'json' | 'base64' | 'jwt' | 'url' | 'uuid'
  | 'time' | 'cron' | 'hash' | 'diff' | 'regex'

const TOOLS: { id: ToolId; label: string; key: string }[] = [
  { id: 'json', label: 'json', key: '1' },
  { id: 'base64', label: 'base64', key: '2' },
  { id: 'jwt', label: 'jwt', key: '3' },
  { id: 'url', label: 'url', key: '4' },
  { id: 'uuid', label: 'uuid', key: '5' },
  { id: 'time', label: 'time', key: '6' },
  { id: 'cron', label: 'cron', key: '7' },
  { id: 'hash', label: 'hash', key: '8' },
  { id: 'diff', label: 'diff', key: '9' },
  { id: 'regex', label: 'regex', key: '0' },
]

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  if (!text) return null
  return (
    <button
      className="btn"
      onClick={() => {
        navigator.clipboard?.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1200)
      }}
    >
      {done ? 'copied' : 'copy'}
    </button>
  )
}

// ---------------- individual tools ----------------

function JsonTool() {
  const [input, setInput] = useState('')
  const [res, setRes] = useState({ ok: false, output: '', error: '' })
  return (
    <div className="stack">
      <div>
        <label className="label" htmlFor="json-in">input</label>
        <textarea id="json-in" className="field" value={input} spellCheck={false}
          placeholder='{"paste":"json here","n":42}'
          onChange={(e) => setInput(e.target.value)} />
      </div>
      <div className="row">
        <button className="btn" onClick={() => setRes(formatJson(input))}>format</button>
        <button className="btn" onClick={() => setRes(minifyJson(input))}>minify</button>
        <button className="btn" onClick={() => setRes(formatJson(input, 4))}>indent 4</button>
        <Copy text={res.output} />
      </div>
      {res.error && <div className="err out">✗ {res.error}</div>}
      {res.ok && (
        <div className="panel">
          <div className="panel__bar"><span className="dot dot--g" /> <b>valid</b> json</div>
          <div className="panel__body out">{res.output}</div>
        </div>
      )}
    </div>
  )
}

function Base64Tool() {
  const [input, setInput] = useState('')
  const [out, setOut] = useState('')
  const [err, setErr] = useState('')
  return (
    <div className="stack">
      <div>
        <label className="label" htmlFor="b64-in">input</label>
        <textarea id="b64-in" className="field" value={input} spellCheck={false}
          placeholder="text or base64…" onChange={(e) => setInput(e.target.value)} />
      </div>
      <div className="row">
        <button className="btn" onClick={() => { setOut(b64Encode(input)); setErr('') }}>encode →</button>
        <button className="btn" onClick={() => { const r = b64Decode(input); r.ok ? (setOut(r.output), setErr('')) : (setOut(''), setErr(r.error)) }}>← decode</button>
        <Copy text={out} />
      </div>
      {err && <div className="err out">✗ {err}</div>}
      {out && <div className="panel"><div className="panel__bar"><span className="dot dot--g" /> <b>out</b></div><div className="panel__body out">{out}</div></div>}
    </div>
  )
}

function JwtTool() {
  const [token, setToken] = useState('')
  const res = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token])
  return (
    <div className="stack">
      <div>
        <label className="label" htmlFor="jwt-in">jwt</label>
        <textarea id="jwt-in" className="field" value={token} spellCheck={false}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…" onChange={(e) => setToken(e.target.value)} />
      </div>
      {res?.error && <div className="err out">✗ {res.error}</div>}
      {res?.ok && (
        <>
          <div className="grid2">
            <div className="panel"><div className="panel__bar"><span className="dot dot--r" /> <b>header</b></div><div className="panel__body out">{res.header}</div></div>
            <div className="panel"><div className="panel__bar"><span className="dot dot--g" /> <b>payload</b></div><div className="panel__body out">{res.payload}</div></div>
          </div>
          <div className={res.expNote.startsWith('expired') ? 'err out' : 'ok out'}>
            {res.expNote || 'no exp claim'} · signature not verified (client-side, no secret)
          </div>
          <AiExplain kind="jwt" value={res.payload} label="explain payload with AI" />
        </>
      )}
    </div>
  )
}

function UrlTool() {
  const [input, setInput] = useState('')
  const [out, setOut] = useState('')
  const [err, setErr] = useState('')
  return (
    <div className="stack">
      <div>
        <label className="label" htmlFor="url-in">input</label>
        <textarea id="url-in" className="field" value={input} spellCheck={false}
          placeholder="a b&c=d/e or %61%20b" onChange={(e) => setInput(e.target.value)} />
      </div>
      <div className="row">
        <button className="btn" onClick={() => { setOut(urlEncode(input)); setErr('') }}>encode →</button>
        <button className="btn" onClick={() => { const r = urlDecode(input); r.ok ? (setOut(r.output), setErr('')) : (setOut(''), setErr(r.error)) }}>← decode</button>
        <Copy text={out} />
      </div>
      {err && <div className="err out">✗ {err}</div>}
      {out && <div className="panel"><div className="panel__bar"><span className="dot dot--g" /> <b>out</b></div><div className="panel__body out">{out}</div></div>}
    </div>
  )
}

function UuidTool() {
  const [n, setN] = useState(5)
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => { setIds(newUuids(5)) }, [])
  return (
    <div className="stack">
      <div className="row">
        <label className="label" htmlFor="uuid-n" style={{ margin: 0 }}>count</label>
        <input id="uuid-n" className="field" style={{ width: '6rem' }} type="number" min={1} max={1000}
          value={n} onChange={(e) => setN(Number(e.target.value))} />
        <button className="btn" onClick={() => setIds(newUuids(n))}>generate</button>
        <Copy text={ids.join('\n')} />
      </div>
      {ids.length > 0 && (
        <div className="panel">
          <div className="panel__bar"><span className="dot dot--g" /> <b>uuid</b> v4 · crypto.randomUUID</div>
          <div className="panel__body out">{ids.join('\n')}</div>
        </div>
      )}
    </div>
  )
}

function TimeTool() {
  const [input, setInput] = useState('')
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    setInput(String(Math.floor(Date.now() / 1000)))
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const r = useMemo(() => timeFromEpoch(input), [input])
  return (
    <div className="stack">
      <div className="row">
        <div style={{ flex: 1 }}>
          <label className="label" htmlFor="time-in">epoch (s/ms) or date string</label>
          <input id="time-in" className="field" value={input} spellCheck={false}
            placeholder="1735689600 / 2025-01-01T00:00:00Z" onChange={(e) => setInput(e.target.value)} />
        </div>
        <button className="btn" style={{ alignSelf: 'flex-end' }}
          onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>now</button>
      </div>
      <div className="muted" style={{ fontSize: '0.75rem' }}>live: {Math.floor(now / 1000)}<span className="cursor" /></div>
      {r.error && input && <div className="err out">✗ {r.error}</div>}
      {r.ok && r.view && (
        <div className="panel">
          <div className="panel__bar"><span className="dot dot--g" /> <b>time</b></div>
          <div className="panel__body out">{[
            `epoch (s) : ${r.view.epochSec}`,
            `epoch (ms): ${r.view.epochMs}`,
            `iso 8601  : ${r.view.iso}`,
            `utc       : ${r.view.utc}`,
            `local     : ${r.view.local}`,
            `relative  : ${r.view.relative}`,
          ].join('\n')}</div>
        </div>
      )}
    </div>
  )
}

function CronTool() {
  const [expr, setExpr] = useState('*/15 9-17 * * 1-5')
  const r = useMemo(() => explainCron(expr), [expr])
  return (
    <div className="stack">
      <div>
        <label className="label" htmlFor="cron-in">cron (min hour dom mon dow)</label>
        <input id="cron-in" className="field" value={expr} spellCheck={false}
          placeholder="*/15 9-17 * * 1-5" onChange={(e) => setExpr(e.target.value)} />
      </div>
      {r.error && <div className="err out">✗ {r.error}</div>}
      {r.ok && (
        <div className="panel">
          <div className="panel__bar"><span className="dot dot--g" /> <b>schedule</b></div>
          <div className="panel__body out">{r.text}</div>
        </div>
      )}
      <AiExplain kind="cron" value={expr} label="explain with AI" />
    </div>
  )
}

function HashTool() {
  const [text, setText] = useState('')
  const [algo, setAlgo] = useState<HashAlgo>('SHA-256')
  const [digest, setDigest] = useState('')
  const [fileName, setFileName] = useState('')
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancel = false
    hashText(algo, text).then((d) => { if (!cancel) setDigest(d) })
    return () => { cancel = true }
  }, [text, algo])

  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    let off = () => {}
    import('@chirag127/oz-file').then(({ onDropZone, readAsArrayBuffer }) => {
      off = onDropZone(el, async (files) => {
        const f = files[0]
        if (!f) return
        setFileName(f.name)
        const buf = await readAsArrayBuffer(f)
        setDigest(await hashBuffer(algo, buf))
        setText('')
      }, { dragClass: 'dragover' })
    })
    return () => off()
  }, [algo])

  return (
    <div className="stack">
      <div className="row">
        {HASH_ALGOS.map((a) => (
          <button key={a} className="tab" aria-selected={a === algo} onClick={() => setAlgo(a)}>{a}</button>
        ))}
      </div>
      <div ref={dropRef} className="panel">
        <div className="panel__bar"><span className="dot dot--y" /> <b>input</b> type or drop a file</div>
        <div className="panel__body">
          <textarea className="field" value={text} spellCheck={false}
            placeholder="text to hash… or drop a file here"
            onChange={(e) => { setText(e.target.value); setFileName('') }} />
          <div className="row" style={{ marginTop: '0.5rem' }}>
            <label className="btn" style={{ cursor: 'pointer' }}>
              pick file
              <input type="file" hidden onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setFileName(f.name)
                const { readAsArrayBuffer } = await import('@chirag127/oz-file')
                setDigest(await hashBuffer(algo, await readAsArrayBuffer(f)))
                setText('')
              }} />
            </label>
            {fileName && <span className="muted">↳ {fileName}</span>}
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel__bar"><span className="dot dot--g" /> <b>{algo}</b></div>
        <div className="panel__body out" style={{ wordBreak: 'break-all' }}>{digest || '—'}</div>
      </div>
      <Copy text={digest} />
    </div>
  )
}

function DiffTool() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const ops = useMemo(() => (a || b ? lineDiff(a, b) : []), [a, b])
  const stats = useMemo(() => {
    let add = 0, del = 0
    for (const o of ops) { if (o.type === 'add') add++; else if (o.type === 'del') del++ }
    return { add, del }
  }, [ops])
  return (
    <div className="stack">
      <div className="grid2">
        <div><label className="label" htmlFor="diff-a">A (original)</label>
          <textarea id="diff-a" className="field" value={a} spellCheck={false} onChange={(e) => setA(e.target.value)} /></div>
        <div><label className="label" htmlFor="diff-b">B (changed)</label>
          <textarea id="diff-b" className="field" value={b} spellCheck={false} onChange={(e) => setB(e.target.value)} /></div>
      </div>
      {ops.length > 0 && (
        <div className="panel">
          <div className="panel__bar"><span className="dot dot--g" /> <b>diff</b> <span className="ok">+{stats.add}</span> <span className="err">-{stats.del}</span></div>
          <div className="panel__body out">
            {ops.map((o, i) => (
              <span key={i} className={o.type === 'add' ? 'diff-add' : o.type === 'del' ? 'diff-del' : 'diff-eq'}>
                {o.type === 'add' ? '+ ' : o.type === 'del' ? '- ' : '  '}{o.line || ' '}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RegexTool() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('gi')
  const [text, setText] = useState('')
  const r = useMemo(() => (pattern ? runRegex(pattern, flags, text) : null), [pattern, flags, text])

  const highlighted = useMemo(() => {
    if (!r?.ok || !r.matches.length) return null
    const parts: { s: string; hl: boolean }[] = []
    let last = 0
    for (const m of r.matches) {
      if (m.index > last) parts.push({ s: text.slice(last, m.index), hl: false })
      parts.push({ s: m.match, hl: true })
      last = m.index + m.match.length
    }
    if (last < text.length) parts.push({ s: text.slice(last), hl: false })
    return parts
  }, [r, text])

  return (
    <div className="stack">
      <div className="row">
        <span className="muted">/</span>
        <input className="field" style={{ flex: 1 }} value={pattern} spellCheck={false}
          placeholder="\b\w+@\w+\.\w+\b" onChange={(e) => setPattern(e.target.value)} aria-label="pattern" />
        <span className="muted">/</span>
        <input className="field" style={{ width: '5rem' }} value={flags} spellCheck={false}
          placeholder="gi" onChange={(e) => setFlags(e.target.value)} aria-label="flags" />
      </div>
      <div>
        <label className="label" htmlFor="rx-txt">test string</label>
        <textarea id="rx-txt" className="field" value={text} spellCheck={false}
          placeholder="paste text to match against…" onChange={(e) => setText(e.target.value)} />
      </div>
      {r?.error && <div className="err out">✗ {r.error}</div>}
      {r?.ok && (
        <div className="panel">
          <div className="panel__bar"><span className="dot dot--g" /> <b>{r.matches.length}</b> match{r.matches.length === 1 ? '' : 'es'}</div>
          <div className="panel__body">
            {highlighted && (
              <div className="out" style={{ marginBottom: '0.6rem' }}>
                {highlighted.map((p, i) => p.hl ? <mark key={i} className="hl">{p.s}</mark> : <span key={i}>{p.s}</span>)}
              </div>
            )}
            {r.matches.length > 0 && (
              <div className="out muted">
                {r.matches.slice(0, 50).map((m, i) =>
                  `#${i + 1} @${m.index} "${m.match}"${m.groups.length ? ' groups[' + m.groups.join(', ') + ']' : ''}`
                ).join('\n')}
              </div>
            )}
          </div>
        </div>
      )}
      <AiExplain kind="regex" value={pattern} label="explain this regex with AI" />
      <GenRegex onUse={(re) => setPattern(re)} />
    </div>
  )
}

function GenRegex({ onUse }: { onUse: (re: string) => void }) {
  const [desc, setDesc] = useState('')
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const firstLine = out.split('\n')[0]?.trim() ?? ''
  async function gen() {
    if (!desc.trim()) return
    setBusy(true); setErr(''); setOut('')
    try {
      const { complete } = await import('@chirag127/oz-ai')
      const text = await complete(`Write a regex for: ${desc}`, {
        system: 'Output ONE JavaScript regex literal on the first line, then <=3 lines explaining it. No preamble.',
      })
      setOut(text.trim())
    } catch { setErr('AI providers unreachable') }
    finally { setBusy(false) }
  }
  return (
    <div className="panel">
      <div className="panel__bar"><span className="dot dot--r" /> <b>ai</b> generate regex from description</div>
      <div className="panel__body stack">
        <div className="row">
          <input className="field" style={{ flex: 1 }} value={desc}
            placeholder="e.g. match an ISO date YYYY-MM-DD" onChange={(e) => setDesc(e.target.value)} />
          <button className="btn btn--hot" onClick={gen} disabled={busy} aria-busy={busy}>{busy ? 'thinking…' : 'generate'}</button>
        </div>
        {err && <div className="err out">{err}</div>}
        {out && (
          <>
            <div className="out">{out}</div>
            {firstLine && <button className="btn" onClick={() => onUse(firstLine.replace(/^\/|\/[a-z]*$/g, ''))}>use pattern ↑</button>}
          </>
        )}
      </div>
    </div>
  )
}

const RENDER: Record<ToolId, () => JSX.Element> = {
  json: JsonTool, base64: Base64Tool, jwt: JwtTool, url: UrlTool, uuid: UuidTool,
  time: TimeTool, cron: CronTool, hash: HashTool, diff: DiffTool, regex: RegexTool,
}

export default function Workbench() {
  const [active, setActive] = useState<ToolId>('json')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement
      if (target && /input|textarea/i.test(target.tagName)) return
      const t = TOOLS.find((x) => x.key === e.key)
      if (t) { setActive(t.id); e.preventDefault() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const Active = RENDER[active]
  return (
    <section className="stack" aria-label="developer tools">
      <div className="tabstrip" role="tablist" aria-label="tools">
        {TOOLS.map((t) => (
          <button key={t.id} role="tab" className="tab" aria-selected={active === t.id}
            onClick={() => setActive(t.id)}>
            <span className="key">{t.key}</span>{t.label}
          </button>
        ))}
      </div>
      <div className="panel" role="tabpanel">
        <div className="panel__bar">
          <span className="dot dot--r" /><span className="dot dot--y" /><span className="dot dot--g" />
          <span style={{ marginLeft: '0.4rem' }}>dev@oriz:~/<b>{active}</b><span className="cursor" /></span>
        </div>
        <div className="panel__body">
          <Active />
        </div>
      </div>
      <div className="muted" style={{ fontSize: '0.72rem', textAlign: 'center' }}>
        press 0–9 to switch tools · everything runs in your browser
      </div>
    </section>
  )
}
