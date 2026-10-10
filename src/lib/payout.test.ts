import { describe, expect, it } from 'vitest'
import { dueAtPayout } from './payout'

const epoch = (y: number, m: number, d: number) => Math.floor(new Date(y, m, d).getTime() / 1000)

describe('dueAtPayout', () => {
  it('jendela 3–20: payout 21 bulan berjalan', () => {
    expect(dueAtPayout(new Date(2026, 9, 10, 14, 30))).toBe(epoch(2026, 9, 21))
  })

  it('tgl 20 masih dianggap bulan berjalan', () => {
    expect(dueAtPayout(new Date(2026, 9, 20, 23, 0))).toBe(epoch(2026, 9, 21))
  })

  it('tgl 21 ke atas: payout 21 bulan depan', () => {
    expect(dueAtPayout(new Date(2026, 9, 25))).toBe(epoch(2026, 10, 21))
    expect(dueAtPayout(new Date(2026, 11, 31))).toBe(epoch(2027, 0, 21))
  })
})
