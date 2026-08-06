import { useState } from 'react'

type Kind = 'regex' | 'jwt' | 'cron' | 'gen-regex'

const PROMPTS: Record<Kind, (v: string) => { system: string; user: string }> = {
  regex: (v) => ({
    system: 'You are a terse regex tutor. Explain the regex in plain English, token by token, in <=6 short bullet lines. No preamble.',
    user: `Explain this regex:\n${v}`,
  }),
  jwt: (v) => ({
    system: 'You explain JWT payloads plainly. Summarize what the claims mean (iss, sub, exp, scopes...) in <=6 short lines. Flag anything expired or unusual. No preamble.',
    user: `Explain this JWT payload JSON:\n${v}`,
  }),
  cron: (v) => ({
    system: 'You explain cron schedules plainly for non-experts, one short paragraph plus when it next-ish runs conceptually. No preamble.',
    user: `Explain this cron expression:\n${v}`,
  }),
  'gen-regex': (v) => ({
    system: 'You output ONE JavaScript regex literal that matches the described requirement, then <=3 lines explaining it. Start with the regex on its own line. No preamble.',
    user: `Write a regex for: ${v}`,
  }),
}

export default function AiExplain({ kind, value, label }: { kind: Kind; value: string; label: string }) {
  const [out, setOut] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function run() {
    if (!value.trim()) {
      setErr('nothing to explain — fill the field first')
      return
    }
    setBusy(true)
    setErr('')
    setOut('')
    try {
      const { complete } = await import('@chirag127/oz-ai')
      const { system, user } = PROMPTS[kind](value)
      const text = await complete(user, { system })
      setOut(text.trim())
    } catch {
      setErr('all AI providers unreachable — core tool still works without AI')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack" style={{ marginTop: '0.6rem' }}>
      <div className="row">
        <button className="btn btn--hot" onClick={run} disabled={busy} aria-busy={busy}>
          {busy ? 'thinking…' : label}
        </button>
        <span className="muted" style={{ fontSize: '0.72rem' }}>AI · optional · no key</span>
      </div>
      {busy && <div className="muted cursor">querying g4f providers</div>}
      {err && <div className="err out">{err}</div>}
      {out && (
        <div className="panel">
          <div className="panel__bar"><span className="dot dot--y" /> <b>ai</b> plain-english</div>
          <div className="panel__body out">{out}</div>
        </div>
      )}
    </div>
  )
}
