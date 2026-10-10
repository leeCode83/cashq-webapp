import { describe, expect, it } from 'vitest'
import { assess, type BureauData } from './bureau'

// deret persis seperti respons live mock YouTube (Apr-Sep 2026, Dapur Bagas)
const DAPUR: BureauData = {
  revenueByMonth: [5_984_200, 6_730_500, 6_412_800, 7_286_100, 7_918_400, 8_400_000],
  viewsByMonth: [618_342, 695_218, 664_119, 754_306, 820_147, 869_825],
  uploadsWeeks: { total: 26, withUpload: 22 },
  monthsActive: 91,
  lateCount: 0,
}

describe('assess — Dapur Bagas (channel sehat)', () => {
  const a = assess(DAPUR)

  it('skor penuh, tier A, rasio 90%', () => {
    expect(a.score).toBe(100)
    expect(a.tier).toBe('A')
    expect(a.ratio).toBe(0.9)
  })

  it('lima sinyal, semua poin penuh', () => {
    expect(a.reasons).toHaveLength(5)
    expect(a.reasons.every((r) => r.poin === r.poinMaks)).toBe(true)
    expect(a.reasons.map((r) => r.poinMaks)).toEqual([20, 20, 20, 20, 20])
  })

  it('verdict menyebut streak dan konsistensi yang benar', () => {
    expect(a.reasons[0].verdict).toContain('3 bulan')
    expect(a.reasons[2].verdict).toContain('22 dari 26')
  })
})

describe('assess — sinyal tunggal', () => {
  it('tren turun panjang: poin tren 0, skor turun ke tier B', () => {
    const a = assess({
      ...DAPUR,
      revenueByMonth: [10_000_000, 9_000_000, 8_000_000, 7_000_000, 6_000_000, 5_000_000],
    })
    expect(a.reasons[0].poin).toBe(0)
    expect(a.score).toBe(56) // 0 + 12 (CV 22,8%) + 20 + 20 + 4 (rpm ikut anjlok krn views naik)
    expect(a.tier).toBe('C')
    expect(a.ratio).toBe(0.7)
  })

  it('volatilitas ekstrem (CV > 50%): poin volatilitas 0', () => {
    const a = assess({
      ...DAPUR,
      revenueByMonth: [2_000_000, 14_000_000, 3_000_000, 15_000_000, 4_000_000, 14_000_000],
      viewsByMonth: [100_000, 100_000, 100_000, 100_000, 100_000, 100_000],
    })
    expect(a.reasons[1].poin).toBe(0)
    expect(a.score).toBe(68) // 8 (streak 1) + 0 + 20 + 20 + 20
  })

  it('lonjakan views 3x median: anomali 0 poin, verdict mencurigakan', () => {
    const a = assess({
      ...DAPUR,
      revenueByMonth: [6_000_000, 6_000_000, 6_000_000, 6_000_000, 6_000_000, 6_000_000],
      viewsByMonth: [100_000, 100_000, 100_000, 100_000, 100_000, 300_000],
    })
    expect(a.reasons[3].poin).toBe(0)
    expect(a.reasons[3].verdict).toContain('mencurigakan')
    expect(a.score).toBe(44) // 0 (datar) + 20 (CV 0) + 20 + 0 + 4 (rpm turun krn views spike)
  })

  it('RPM anjlok (revenue dipangkas, views tetap): niche 4 poin', () => {
    const a = assess({
      ...DAPUR,
      revenueByMonth: [6_000_000, 6_000_000, 6_000_000, 6_000_000, 6_000_000, 3_000_000],
      viewsByMonth: [100_000, 100_000, 100_000, 100_000, 100_000, 100_000],
    })
    expect(a.reasons[4].poin).toBe(4)
    expect(a.score).toBe(56) // 0 (turun) + 12 (CV 20,3%) + 20 + 20 + 4
  })
})

describe('assess — modifikator', () => {
  it('kreator baru (< 12 bulan): tier A dipaksa turun ke B dengan alasan', () => {
    const a = assess({ ...DAPUR, monthsActive: 5 })
    expect(a.tier).toBe('B')
    expect(a.ratio).toBe(0.8)
    expect(a.reasons.some((r) => r.verdict.toLowerCase().includes('baru'))).toBe(true)
  })

  it('lateCount memotong poin 10 per telat', () => {
    expect(assess({ ...DAPUR, lateCount: 1 }).score).toBe(90)
    expect(assess({ ...DAPUR, lateCount: 3 }).score).toBe(70)
  })

  it('penalti telat dibatasi 30 poin dan skor tidak negatif', () => {
    const jelek = assess({
      revenueByMonth: [10_000_000, 2_000_000, 9_000_000, 1_000_000, 8_000_000, 1_000_000],
      viewsByMonth: [100, 100, 100, 100, 100, 100],
      uploadsWeeks: { total: 26, withUpload: 0 },
      monthsActive: 3,
      lateCount: 9,
    })
    expect(jelek.score).toBe(0)
    expect(jelek.tier).toBe('C')
    expect(jelek.ratio).toBe(0.7)
  })
})

describe('assess — data tidak cukup', () => {
  it('histori kurang dari 2 bulan: skor 0 tier C', () => {
    const a = assess({ ...DAPUR, revenueByMonth: [1_000_000], viewsByMonth: [100] })
    expect(a.score).toBe(0)
    expect(a.tier).toBe('C')
    expect(a.reasons[0].nama).toBe('Histori')
  })
})
