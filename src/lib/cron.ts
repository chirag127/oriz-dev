/** Tiny 5-field cron → plain English. Pure, no deps. */

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MON = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export interface CronResult {
  ok: boolean
  text: string
  error: string
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/** Expand one field to a human phrase for a given range/name mapper. */
function field(
  spec: string,
  min: number,
  max: number,
  name: (n: number) => string,
): { every: boolean; phrase: string; list: number[] } {
  if (spec === '*') return { every: true, phrase: '', list: [] }
  const list: number[] = []
  for (const part of spec.split(',')) {
    const step = part.includes('/') ? part.split('/') : [part, '1']
    const stepN = Number(step[1])
    const rangePart = step[0]
    if (rangePart === '*') {
      for (let i = min; i <= max; i += stepN) list.push(i)
    } else if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-').map(Number)
      for (let i = a; i <= b; i += stepN) list.push(i)
    } else {
      list.push(Number(rangePart))
    }
  }
  const uniq = [...new Set(list)].filter((n) => n >= min && n <= max).sort((a, b) => a - b)
  // step over whole range → "every N"
  const stepMatch = spec.match(/^\*\/(\d+)$/)
  if (stepMatch) return { every: false, phrase: `every ${stepMatch[1]}`, list: uniq }
  return { every: false, phrase: uniq.map(name).join(', '), list: uniq }
}

export function explainCron(expr: string): CronResult {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) {
    return { ok: false, text: '', error: `expected 5 fields, got ${parts.length}` }
  }
  const [minS, hourS, domS, monS, dowS] = parts
  try {
    const num = (n: number) => String(n)
    const min = field(minS, 0, 59, num)
    const hour = field(hourS, 0, 23, num)
    const dom = field(domS, 1, 31, (n) => ordinal(n))
    const mon = field(monS, 1, 12, (n) => MON[n - 1])
    const dow = field(dowS, 0, 6, (n) => DOW[n % 7])

    const bits: string[] = []

    // time-of-day
    const stepMin = minS.match(/^\*\/(\d+)$/)
    const stepHour = hourS.match(/^\*\/(\d+)$/)
    if (stepMin) {
      bits.push(`every ${stepMin[1]} minutes`)
    } else if (min.every && hour.every) {
      bits.push('every minute')
    } else if (min.every) {
      bits.push('every minute')
      bits.push(stepHour ? `every ${stepHour[1]} hours` : `past hour ${hour.phrase}`)
    } else {
      // specific minute(s) + hour(s)
      if (!hour.every && !stepHour && hour.list.length && min.list.length) {
        const times: string[] = []
        for (const h of hour.list)
          for (const mm of min.list)
            times.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
        bits.push('at ' + times.join(', '))
      } else {
        bits.push(`at minute ${min.phrase}`)
        if (stepHour) bits.push(`every ${stepHour[1]} hours`)
        else if (!hour.every) bits.push(`past hour ${hour.phrase}`)
      }
    }

    if (!dom.every) bits.push(`on the ${dom.phrase} of the month`)
    if (!mon.every) bits.push(`in ${mon.phrase}`)
    if (!dow.every) bits.push(`on ${dow.phrase}`)

    return { ok: true, text: bits.join(', '), error: '' }
  } catch (e) {
    return { ok: false, text: '', error: (e as Error).message }
  }
}
