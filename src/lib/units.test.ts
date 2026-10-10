import { describe, expect, it } from 'vitest'
import { feeOf, idr, raw } from './units'

describe('units', () => {
  it('raw: rupiah → unit mentah 6 desimal', () => {
    expect(raw('12400000')).toBe(12_400_000_000_000n)
    expect(raw(8_400_000)).toBe(8_400_000_000_000n)
  })

  it('idr: unit mentah → rupiah, roundtrip dengan raw', () => {
    expect(idr(12_400_000_000_000n)).toBe(12_400_000)
    const x = 4_250_000_000_000n
    expect(raw(idr(x))).toBe(x)
  })

  it('feeOf: 2,75% sesuai rumus kontrak', () => {
    // 8.400.000 IDRX → fee 231.000 IDRX
    expect(feeOf(8_400_000_000_000n)).toBe(231_000_000_000n)
  })

  it('feeOf: membulatkan ke bawah seperti divisi integer kontrak', () => {
    // 1234567 × 275 = 339505925; /10000 = 33950,5925 → 33950
    expect(feeOf(1_234_567n)).toBe(33_950n)
  })
})
