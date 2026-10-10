import { describe, expect, it } from 'vitest'
import { buildSnapshot, hashSeed, hitungKonsistensi, labelBulan, type AnalyticsReport, type ChannelList, type PlaylistItemList } from './bureau-api'

// fixture menyalin respons live mock YouTube (terverifikasi via curl 10 Okt 2026)
const FIX_ANALYTICS: AnalyticsReport = {
  columnHeaders: [
    { name: 'month', columnType: 'DIMENSION', dataType: 'STRING' },
    { name: 'views', columnType: 'METRIC', dataType: 'INTEGER' },
    { name: 'estimatedRevenue', columnType: 'METRIC', dataType: 'FLOAT' },
  ],
  rows: [
    ['2026-04', 618342, 5984200],
    ['2026-05', 695218, 6730500],
    ['2026-06', 664119, 6412800],
    ['2026-07', 754306, 7286100],
    ['2026-08', 820147, 7918400],
    ['2026-09', 869825, 8400000],
  ],
}

const FIX_CHANNELS: ChannelList = {
  items: [
    {
      id: 'UCdJrQE8dnNodLwN2nFjMhxQ',
      snippet: { title: 'Dapur Bagas', publishedAt: '2019-03-14T06:12:45Z' },
    },
  ],
}

const REF = new Date('2026-10-09T00:00:00Z')

describe('labelBulan', () => {
  it('menerjemahkan YYYY-MM ke singkatan bulan Indonesia', () => {
    expect(labelBulan('2026-04')).toBe('Apr')
    expect(labelBulan('2026-12')).toBe('Des')
  })
})

describe('hashSeed', () => {
  it('deterministik, sensitif input, dan berada di rentang uint32', () => {
    expect(hashSeed('0xabc')).toBe(hashSeed('0xabc'))
    expect(hashSeed('0xabc')).not.toBe(hashSeed('0xabd'))
    for (const s of ['', 'akun-a', '0xffffffffffffffff']) {
      const h = hashSeed(s)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(0xffffffff)
    }
  })
})

describe('hitungKonsistensi', () => {
  it('menghitung minggu unik ber-upload dalam 26 minggu terakhir', () => {
    const items = {
      pageInfo: { totalResults: 1104 },
      items: [
        { snippet: { publishedAt: '2026-10-06T09:00:00Z' } }, // minggu ini
        { snippet: { publishedAt: '2026-10-01T09:00:00Z' } }, // minggu yang sama (tidak dihitung dua kali)
        { snippet: { publishedAt: '2026-09-28T09:00:00Z' } }, // minggu lalu
        { snippet: { publishedAt: '2026-04-27T09:00:00Z' } }, // minggu ke-24 (masih jendela)
        { snippet: { publishedAt: '2026-04-01T09:00:00Z' } }, // di luar jendela
      ],
    } satisfies PlaylistItemList
    expect(hitungKonsistensi(items, REF)).toEqual({ total: 26, withUpload: 3 })
  })

  it('item tanpa tanggal diabaikan', () => {
    const items = { items: [{ snippet: {} }, {}] } as PlaylistItemList
    expect(hitungKonsistensi(items, REF)).toEqual({ total: 26, withUpload: 0 })
  })
})

describe('buildSnapshot', () => {
  it('merakit BureauData dari tiga respons API', () => {
    const uploads: PlaylistItemList = {
      pageInfo: { totalResults: 1104 },
      items: [{ snippet: { publishedAt: '2026-10-06T09:00:00Z' } }],
    }
    const data = buildSnapshot(FIX_ANALYTICS, FIX_CHANNELS, uploads, REF)
    expect(data.revenueByMonth).toEqual([5984200, 6730500, 6412800, 7286100, 7918400, 8400000])
    expect(data.viewsByMonth[0]).toBe(618342)
    expect(data.months).toEqual(['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'])
    expect(data.monthsActive).toBe(90) // 2019-03-14 s/d 2026-10-09
    expect(data.uploadsWeeks).toEqual({ total: 26, withUpload: 1 })
    expect(data.lateCount).toBe(0) // diisi pemanggil dari rapor on-chain
  })
})
