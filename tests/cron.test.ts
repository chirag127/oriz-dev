import { describe, expect, it } from 'vitest'
import { explainCron } from '../src/lib/cron'

describe('cron', () => {
  it('rejects wrong field count', () => {
    expect(explainCron('* * *').ok).toBe(false)
  })
  it('every minute', () => {
    expect(explainCron('* * * * *').text).toContain('every minute')
  })
  it('step minutes', () => {
    expect(explainCron('*/15 * * * *').text).toContain('every 15 minutes')
  })
  it('specific time', () => {
    const r = explainCron('30 9 * * *')
    expect(r.text).toContain('09:30')
  })
  it('weekdays', () => {
    const r = explainCron('0 9 * * 1-5')
    expect(r.text).toContain('Monday')
    expect(r.text).toContain('Friday')
  })
  it('day of month', () => {
    expect(explainCron('0 0 1 * *').text).toContain('1st')
  })
  it('month name', () => {
    expect(explainCron('0 0 1 1 *').text).toContain('January')
  })
})
