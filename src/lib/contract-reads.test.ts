import { describe, expect, it } from 'vitest'
import { toUiAdvance, type OnchainAdvance } from './contract-reads'

const advance = (diubah: Partial<OnchainAdvance> = {}): OnchainAdvance => ({
  id: 3,
  creator: '0x0000000000000000000000000000000000000001',
  nullifier: `0x${'ab'.repeat(32)}`,
  principal: 8_400_000_000_000n,
  fee: 231_000_000_000n,
  // 21 Okt 2026 00:00 waktu lokal (epoch dihitung dari zona mesin uji)
  dueAt: BigInt(Math.floor(new Date(2026, 9, 21).getTime() / 1000)),
  swept: true,
  ...diubah,
})

describe('toUiAdvance', () => {
  it('advance lunas: status LUNAS, sweptAt dari rapor, bulan penghasilan = sebelum payout', () => {
    const at = Math.floor(new Date(2026, 9, 21, 10).getTime() / 1000)
    const ui = toUiAdvance(advance(), [{ advanceId: 3n, amount: 8_631_000_000_000n, at: BigInt(at) }])
    expect(ui.id).toBe('ADV-03')
    expect(ui.onchainId).toBe(3)
    expect(ui.status).toBe('LUNAS')
    expect(ui.onTime).toBe(true)
    expect(ui.principal).toBe(8_400_000)
    expect(ui.fee).toBe(231_000)
    expect(ui.earningsMonth).toBe('Sep 26')
    expect(new Date(ui.sweptAt).getTime()).toBe(new Date(2026, 9, 21, 10).getTime())
  })

  it('advance aktif tanpa rapor: status AKTIF, sweptAt jatuh ke dueAt', () => {
    const ui = toUiAdvance(advance({ swept: false }), [])
    expect(ui.status).toBe('AKTIF')
    expect(ui.onTime).toBe(false)
    expect(new Date(ui.sweptAt).getDate()).toBe(21)
  })

  it('rapor advance lain diabaikan', () => {
    const ui = toUiAdvance(advance({ swept: false }), [{ advanceId: 9n, amount: 1n, at: 1n }])
    expect(ui.status).toBe('AKTIF')
  })
})
