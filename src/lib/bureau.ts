/**
 * Engine scorecard bureau CashQ — rule-based murni, tanpa ML.
 * Tiap sinyal dibin nilai lalu diberi poin tetap (maks 20/sinyal); total
 * poin menjadi skor 0-100 yang dipetakan ke tier dan rasio.
 *
 * RASIO HANYA INFORMASI: batas cair nyata ditetapkan kontrak SC (jumlah
 * token yang di-advance), bukan oleh engine ini.
 */

export interface BureauData {
  /** pendapatan IDRX per bulan, urut tertua ke terbaru (min. 2 entri) */
  revenueByMonth: number[]
  /** views per bulan, sejajar revenueByMonth */
  viewsByMonth: number[]
  /** label bulan YYYY-MM sejajar deret di atas — pelengkap tampilan, tidak dipakai engine */
  months?: string[]
  uploadsWeeks: { total: number; withUpload: number }
  /** usia channel dalam bulan */
  monthsActive: number
  /** jumlah pelunasan terlambat dari rapor on-chain */
  lateCount: number
}

export interface AlasanBureau {
  nama: string
  verdict: string
  poin: number
  poinMaks: number
}

export interface Assessment {
  score: number
  tier: 'A' | 'B' | 'C'
  /** informasi (0.9/0.8/0.7); batas cair nyata di kontrak SC */
  ratio: number
  reasons: AlasanBureau[]
}

const RASIO = { A: 0.9, B: 0.8, C: 0.7 } as const

function median(nilai: number[]): number {
  const s = [...nilai].sort((a, b) => a - b)
  const t = Math.floor(s.length / 2)
  return s.length % 2 === 1 ? s[t] : (s[t - 1] + s[t]) / 2
}

/** jumlah kenaikan beruntun menghitung dari bulan terbaru */
function streakNaik(rev: number[]): number {
  let streak = 0
  for (let i = rev.length - 1; i > 0; i--) {
    if (rev[i] > rev[i - 1]) streak++
    else break
  }
  return streak
}

/** simpangan baku populasi / mean, dalam persen */
function koefisienVariasi(rev: number[]): number {
  const mean = rev.reduce((a, b) => a + b, 0) / rev.length
  if (mean === 0) return 0
  const variansi = rev.reduce((a, b) => a + (b - mean) ** 2, 0) / rev.length
  return (Math.sqrt(variansi) / mean) * 100
}

function fmt(n: number, desimal = 1): string {
  return n.toLocaleString('id-ID', { maximumFractionDigits: desimal })
}

export function assess(data: BureauData): Assessment {
  const { revenueByMonth: rev, viewsByMonth: views, uploadsWeeks, monthsActive, lateCount } = data

  if (rev.length < 2 || views.length < 2) {
    return {
      score: 0,
      tier: 'C',
      ratio: RASIO.C,
      reasons: [{ nama: 'Histori', verdict: 'Data historis tidak cukup untuk dinilai', poin: 0, poinMaks: 100 }],
    }
  }

  // ---- 5 sinyal x 20 poin ----

  const streak = streakNaik(rev)
  const poinTren = streak >= 3 ? 20 : streak === 2 ? 14 : streak === 1 ? 8 : 0
  const tren: AlasanBureau = {
    nama: 'Arah tren',
    verdict: streak > 0 ? `Naik ${streak} bulan beruntun` : 'Tren datar atau turun',
    poin: poinTren,
    poinMaks: 20,
  }

  const cv = koefisienVariasi(rev)
  const poinVolatilitas = cv <= 15 ? 20 : cv <= 30 ? 12 : cv <= 50 ? 5 : 0
  const volatilitas: AlasanBureau = {
    nama: 'Volatilitas bulanan',
    verdict: `Bervariasi ±${fmt(cv)}% per bulan`,
    poin: poinVolatilitas,
    poinMaks: 20,
  }

  const pct = (uploadsWeeks.withUpload / uploadsWeeks.total) * 100
  const poinKonsistensi = pct >= 80 ? 20 : pct >= 60 ? 12 : pct >= 40 ? 6 : 0
  const konsistensi: AlasanBureau = {
    nama: 'Konsistensi upload',
    verdict: `${uploadsWeeks.withUpload} dari ${uploadsWeeks.total} minggu (${fmt(pct)}%)`,
    poin: poinKonsistensi,
    poinMaks: 20,
  }

  const medianViews = median(views.slice(0, -1))
  const rasioViews = views[views.length - 1] / medianViews
  const poinAnomali = rasioViews > 2.5 ? 0 : rasioViews > 1.5 ? 10 : 20
  const anomali: AlasanBureau = {
    nama: 'Anomali traffic',
    verdict:
      rasioViews > 2.5
        ? `Lonjakan views ${fmt(rasioViews, 2)}x median — mencurigakan`
        : rasioViews > 1.5
          ? `Views naik ${fmt(rasioViews, 2)}x median — diawasi`
          : 'Tidak ada lonjakan mencurigakan',
    poin: poinAnomali,
    poinMaks: 20,
  }

  const rpm = rev.map((r, i) => r / views[i])
  const medianRpm = median(rpm.slice(0, -1))
  const rasioRpm = rpm[rpm.length - 1] / medianRpm
  const poinNiche = rasioRpm >= 0.95 ? 20 : rasioRpm >= 0.8 ? 12 : 4
  const niche: AlasanBureau = {
    nama: 'Niche (RPM)',
    verdict: rasioRpm >= 0.95 ? 'RPM stabil, minat penonton sehat' : `RPM turun ke ${fmt(rasioRpm * 100, 0)}% dari median`,
    poin: poinNiche,
    poinMaks: 20,
  }

  // ---- modifikator ----

  const reasons = [tren, volatilitas, konsistensi, anomali, niche]
  let score = poinTren + poinVolatilitas + poinKonsistensi + poinAnomali + poinNiche

  if (lateCount > 0) {
    const penalti = Math.min(lateCount, 3) * 10
    score -= penalti
    reasons.push({
      nama: 'Rapor pelunasan',
      verdict: `${lateCount} pelunasan terlambat — penalti ${penalti} poin`,
      poin: -penalti,
      poinMaks: 0,
    })
  }

  score = Math.max(0, score)
  let tier: Assessment['tier'] = score >= 80 ? 'A' : score >= 60 ? 'B' : 'C'

  if (monthsActive < 12 && tier === 'A') {
    tier = 'B'
    reasons.push({
      nama: 'Usia channel',
      verdict: `Channel baru (${monthsActive} bulan) — tier maksimal B`,
      poin: 0,
      poinMaks: 0,
    })
  }

  return { score, tier, ratio: RASIO[tier], reasons }
}
