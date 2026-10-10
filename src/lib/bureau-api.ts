/**
 * Lapisan akses data bureau: merakit BureauData dari tiga respons API mock
 * YouTube (Analytics v2 + Data API v3), lalu menilainya via assess().
 * Ini jalur data terpisah dari bukti zkTLS — histori channel, bukan saldo.
 */

import { assess, type Assessment, type BureauData } from './bureau.ts'

/** serverless functions di repo mock-adsense (deploy Vercel kedua) */
export const MOCK_YT_BASE = 'https://cashy-web-mock-adsense.vercel.app'
const BEARER = { Authorization: 'Bearer demo' }

/** potongan respons Analytics API v2 (reports.query) yang dibaca */
export interface AnalyticsReport {
  columnHeaders: { name: string; columnType: string; dataType: string }[]
  rows?: (string | number)[][]
}

/** potongan respons Data API v3 (channels.list) yang dibaca */
export interface ChannelList {
  items: {
    id: string
    contentDetails?: { relatedPlaylists?: { uploads?: string } }
    snippet?: { title?: string; publishedAt?: string }
  }[]
}

/** potongan respons Data API v3 (playlistItems.list) yang dibaca */
export interface PlaylistItemList {
  pageInfo?: { totalResults?: number }
  items?: { snippet?: { publishedAt?: string } }[]
}

export interface Snapshot {
  data: BureauData
  assessment: Assessment
  meta: { diambilPada: string; sumber: string; profil: number | null }
}

/** banyak profil data yang dimiliki mock server */
export const JUMLAH_PROFIL = 20

/** FNV-1a 32-bit — ofset profil per akun supaya akun berbeda tak identik */
export function hashSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const BULAN_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function labelBulan(bulan: string): string {
  const i = Number(bulan.slice(5, 7)) - 1
  return BULAN_ID[i] ?? bulan
}

/** usia channel dalam bulan kalender penuh */
function bulanSejak(publishedAt: string, ref: Date): number {
  const t = new Date(publishedAt)
  const bulan = (ref.getFullYear() - t.getFullYear()) * 12 + (ref.getMonth() - t.getMonth())
  return ref.getDate() < t.getDate() ? bulan - 1 : bulan
}

/** Senin pekan tanggal yang diberikan (UTC) */
function seninPekan(d: Date): number {
  const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const hari = (d.getUTCDay() + 6) % 7 // Senin = 0
  return utc - hari * 86_400_000
}

/**
 * Ritme upload: berapa pekan unik (maks 26 pekan terakhir) yang punya
 * minimal satu upload. Tanggal ganda dalam satu pekan dihitung sekali.
 */
export function hitungKonsistensi(uploads: PlaylistItemList, ref: Date): { total: number; withUpload: number } {
  const awal = seninPekan(ref) - 25 * 7 * 86_400_000
  const pekan = new Set<number>()
  for (const item of uploads.items ?? []) {
    const t = item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : null
    if (!t || Number.isNaN(t.getTime())) continue
    const senin = seninPekan(t)
    if (senin >= awal && senin <= seninPekan(ref)) pekan.add(senin)
  }
  return { total: 26, withUpload: pekan.size }
}

function angkaBaris(analytics: AnalyticsReport): { views: number[]; revenue: number[]; months: string[] } {
  const nama = analytics.columnHeaders.map((h) => h.name)
  const iViews = nama.indexOf('views')
  const iRevenue = nama.indexOf('estimatedRevenue')
  const iMonth = nama.indexOf('month')
  const rows = [...(analytics.rows ?? [])].sort((a, b) => String(a[iMonth]).localeCompare(String(b[iMonth])))
  return {
    views: rows.map((r) => Number(r[iViews])),
    revenue: rows.map((r) => Number(r[iRevenue])),
    months: rows.map((r) => String(r[iMonth])),
  }
}

export function buildSnapshot(
  analytics: AnalyticsReport,
  channels: ChannelList,
  uploads: PlaylistItemList,
  ref: Date = new Date(),
): BureauData {
  const { views, revenue, months } = angkaBaris(analytics)
  const publishedAt = channels.items[0]?.snippet?.publishedAt
  return {
    revenueByMonth: revenue,
    viewsByMonth: views,
    months,
    uploadsWeeks: hitungKonsistensi(uploads, ref),
    monthsActive: publishedAt ? bulanSejak(publishedAt, ref) : 0,
    // rapor on-chain bukan bagian API YouTube — diisi pemanggil dari store
    lateCount: 0,
  }
}

async function ambilJson(path: string): Promise<unknown> {
  const res = await fetch(`${MOCK_YT_BASE}${path}`, { headers: BEARER })
  if (!res.ok) throw new Error(`mock YouTube ${path} -> HTTP ${res.status}`)
  return res.json()
}

/** ponytail: rentang query dipaku Apr-Sep 2026 — dataset mock hanya sel itu. */
const QUERY_REPORTS =
  '/api/youtube/v2/reports?ids=channel==MINE&startDate=2026-04-01&endDate=2026-09-01&metrics=views,estimatedRevenue&dimensions=month'

/**
 * Satu snapshot penilaian: tarik Analytics + channel, lalu playlistItems dari
 * uploads playlist channel tersebut (rantai asli Data API), rakit BureauData,
 * dan nilai dengan engine. `lateCount` disuntik dari rapor on-chain store.
 * `profil` eksplisit diteruskan ke mock supaya ketiga endpoint satu snapshot
 * konsisten satu profil; dibiarkan undefined untuk rotasi waktu di mock.
 */
export async function fetchSnapshot(lateCount = 0, profil?: number): Promise<Snapshot> {
  const suf = profil === undefined ? '' : `&profil=${profil}`
  const analytics = (await ambilJson(QUERY_REPORTS + suf)) as AnalyticsReport
  const channels = (await ambilJson('/api/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true' + suf)) as ChannelList
  const playlist = channels.items[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!playlist) throw new Error('mock YouTube: uploads playlist tidak ditemukan')
  const uploads = (await ambilJson(`/api/youtube/v3/playlistItems?part=snippet&playlistId=${playlist}&maxResults=50${suf}`)) as PlaylistItemList

  const data = { ...buildSnapshot(analytics, channels, uploads), lateCount }
  return {
    data,
    assessment: assess(data),
    meta: {
      diambilPada: new Date().toISOString(),
      sumber: 'mock YouTube Analytics + Data API (cashy-web-mock-adsense.vercel.app)',
      profil: profil ?? null,
    },
  }
}
