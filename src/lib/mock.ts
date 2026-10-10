// Data tampilan CashQ. Hari "hari ini" prototipe: 9 Okt 2026.
// Angka organik, bukan bulat, karena buku besar asli tidak pernah bulat.

export const TODAY = new Date('2026-10-09T09:00:00+07:00')

export type AdvanceStatus = 'LUNAS' | 'AKTIF'

export interface Advance {
  id: string
  /** id advance di vault on-chain (index `advances(id)`), bila sudah on-chain */
  onchainId?: number
  /** bulan penghasilan yang di-advance */
  earningsMonth: string
  saldoFinal: number
  pajakEst: number
  principal: number // diterima kreator
  fee: number
  sweptAt: string // tanggal autodebet
  requestedAt: string
  nullifier: string
  onTime: boolean
  status: AdvanceStatus
}

export interface Notif {
  id: string
  title: string
  body: string
  at: string
  kind: 'sukses' | 'info' | 'debet'
  read: boolean
}

export interface LpTx {
  id: string
  kind: 'SETOR' | 'TARIK' | 'YIELD'
  amount: number
  at: string
  status: 'SELESAI' | 'ANTRE'
}

export interface Sweep {
  id: string
  creator: string
  channel: string
  earningsMonth: string
  amount: number
  sweptAt: string
}

// ---------- Kreator: Bagas Pradiyo, "Dapur Bagas" (kuliner, 1,18 jt subscriber) ----------

export const creator = {
  name: 'Bagas Pradiyo',
  channel: 'Dapur Bagas',
  handle: '@dapurbagas',
  niche: 'Kuliner',
  subscribers: '1,18 jt',
  memberSince: 'Feb 2025',
  wallet: '0x7C3a…9F2b',
  balance: 2_113_400,
}

/** riwayat advance: 11 siklus lunas, Feb 2025 sampai penghasilan Agu 2026 */
export const advanceHistory: Advance[] = [
  mAdvance('ADV-08-26', 'Agu 2026', 17_318_500, 2_597_775, 12_400_000, '2026-09-04', '2026-09-21', '0x9f21e4a7c8'),
  mAdvance('ADV-07-26', 'Jul 2026', 16_882_300, 2_532_345, 11_850_000, '2026-08-05', '2026-08-21', '0x4c88d1f3ab'),
  mAdvance('ADV-06-26', 'Jun 2026', 15_240_100, 2_286_015, 10_950_000, '2026-07-06', '2026-07-22', '0x77b2e0d59c'),
  mAdvance('ADV-05-26', 'Mei 2026', 14_977_800, 2_246_670, 10_200_000, '2026-06-03', '2026-06-22', '0x21fa6c94b0'),
  mAdvance('ADV-04-26', 'Apr 2026', 14_105_200, 2_115_780, 9_650_000, '2026-05-05', '2026-05-21', '0xaa38f07d12'),
  mAdvance('ADV-03-26', 'Mar 2026', 13_488_900, 2_023_335, 9_400_000, '2026-04-07', '2026-04-22', '0xd904be77c5'),
  mAdvance('ADV-02-26', 'Feb 2026', 12_655_400, 1_898_310, 8_900_000, '2026-03-04', '2026-03-23', '0x5c1e9f3a68'),
  mAdvance('ADV-01-26', 'Jan 2026', 12_402_700, 1_860_405, 8_750_000, '2026-02-04', '2026-02-23', '0x8b47c2e1f9'),
  mAdvance('ADV-11-25', 'Nov 2025', 11_530_100, 1_729_515, 8_200_000, '2025-12-03', '2025-12-22', '0xe76a30cd44'),
  mAdvance('ADV-09-25', 'Sep 2025', 10_844_600, 1_626_690, 7_600_000, '2025-10-06', '2025-10-22', '0x3f5d81b2e7'),
  mAdvance('ADV-06-25', 'Jun 2025', 9_271_300, 1_390_695, 6_750_000, '2025-07-07', '2025-07-23', '0x62c9f4a018'),
]

function mAdvance(
  id: string,
  earningsMonth: string,
  saldoFinal: number,
  pajakEst: number,
  principal: number,
  requestedAt: string,
  sweptAt: string,
  nullSeed: string,
): Advance {
  return {
    id,
    earningsMonth,
    saldoFinal,
    pajakEst,
    principal,
    fee: Math.round(principal * 0.0275),
    sweptAt,
    requestedAt,
    nullifier: nullSeed + nullSeed.slice(2, 8).split('').reverse().join('') + 'd',
    onTime: true,
    status: 'LUNAS',
  }
}

/** sasaran advance berikutnya: penghasilan Sep 2026, final diposting 3 Okt */
export const sepEarnings = {
  month: 'Sep 2026',
  postedAt: '2026-10-03',
  payoutAt: '2026-10-21',
  /** senilai SCHEMA_FLOOR di lib/zktls — satu realitas untuk mock AdSense, schema, dan app */
  saldoFinal: 8_400_000,
  /** fallback pajak docs (rate withholding umum non-AS 10–30%) */
  taxRate: 0.2,
  get pajakEst() {
    return Math.round(this.saldoFinal * this.taxRate)
  },
  /** batas demo statis: 90% dari saldo setelah pajak */
  get limit() {
    return Math.round((this.saldoFinal - this.pajakEst) * 0.9)
  },
}

export const FEE_RATE = 0.0275
export const MIN_ADVANCE = 500_000

export const rapor = {
  late: 0,
  default: 0,
  score: 94,
  since: 'Feb 2025',
}

export const initialNotifs: Notif[] = [
  {
    id: 'N-41',
    title: 'Saldo final Sep 2026 sudah diposting Google',
    body: 'IDRX 8.400.000 tercatat di halaman Pembayaran AdSense. Jendela advance terbuka sampai 20 Okt.',
    at: '2026-10-03T08:12:00+07:00',
    kind: 'info',
    read: false,
  },
  {
    id: 'N-40',
    title: 'Autodebet ADV-08-26 berhasil',
    body: 'IDRX 12.741.000 didebet otomatis saat payout Google masuk. Sisa payout utuh di rekening Anda.',
    at: '2026-09-21T10:04:00+07:00',
    kind: 'debet',
    read: false,
  },
  {
    id: 'N-39',
    title: 'Rapor kredit diperbarui',
    body: 'Pelunasan tepat waktu ke-11 tercatat on-chain. Rasio advance maksimum Anda tetap 90%.',
    at: '2026-09-21T10:05:00+07:00',
    kind: 'sukses',
    read: false,
  },
  {
    id: 'N-38',
    title: 'Payout Google diterima',
    body: 'IDRX 14.720.725 masuk ke rekening pembayaran (setelah pajak AS 15%).',
    at: '2026-09-21T09:58:00+07:00',
    kind: 'sukses',
    read: true,
  },
  {
    id: 'N-37',
    title: 'Vault utilization 71,3%',
    body: 'Yield pool LP annualized 14,2% bulan ini. Likuiditas pool sehat.',
    at: '2026-10-01T17:30:00+07:00',
    kind: 'info',
    read: true,
  },
]

// ---------- LP: Rani Wijaya, penyedia dana vault sejak Mar 2025 ----------

export const lp = {
  name: 'Rani Wijaya',
  wallet: '0x41Df…73Aa',
  since: 'Mar 2025',
}

export const vault = {
  tvl: 11_847_500_000,
  outstanding: 8_436_000_000,
  apy: 14.2,
  yieldHistory: [12.1, 12.4, 13.1, 13.0, 13.8, 14.2],
  yieldMonths: ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'],
  get utilization() {
    return (this.outstanding / this.tvl) * 100
  },
  get freeLiquidity() {
    return this.tvl - this.outstanding
  },
}

export const lpPosition = 4_250_000_000

export const lpTxs: LpTx[] = [
  { id: 'LP-96', kind: 'YIELD', amount: 49_842_600, at: '2026-10-01T09:00:00+07:00', status: 'SELESAI' },
  { id: 'LP-94', kind: 'SETOR', amount: 2_500_000_000, at: '2026-02-17T10:22:00+07:00', status: 'SELESAI' },
  { id: 'LP-92', kind: 'TARIK', amount: 750_000_000, at: '2026-01-28T15:41:00+07:00', status: 'ANTRE' },
  { id: 'LP-90', kind: 'YIELD', amount: 47_213_900, at: '2026-09-01T09:00:00+07:00', status: 'SELESAI' },
  { id: 'LP-88', kind: 'YIELD', amount: 45_908_200, at: '2026-08-01T09:00:00+07:00', status: 'SELESAI' },
  { id: 'LP-86', kind: 'YIELD', amount: 43_776_500, at: '2026-07-01T09:00:00+07:00', status: 'SELESAI' },
  { id: 'LP-84', kind: 'YIELD', amount: 41_342_800, at: '2026-06-01T09:00:00+07:00', status: 'SELESAI' },
  { id: 'LP-82', kind: 'SETOR', amount: 500_000_000, at: '2026-05-12T16:30:00+07:00', status: 'SELESAI' },
  { id: 'LP-80', kind: 'YIELD', amount: 38_515_700, at: '2026-05-01T09:00:00+07:00', status: 'SELESAI' },
  { id: 'LP-78', kind: 'YIELD', amount: 36_923_400, at: '2026-04-01T09:00:00+07:00', status: 'SELESAI' },
  { id: 'LP-76', kind: 'YIELD', amount: 34_408_900, at: '2026-03-01T09:00:00+07:00', status: 'SELESAI' },
  { id: 'LP-74', kind: 'SETOR', amount: 2_000_000_000, at: '2025-03-14T11:05:00+07:00', status: 'SELESAI' },
  { id: 'LP-72', kind: 'TARIK', amount: 300_000_000, at: '2025-11-19T13:12:00+07:00', status: 'SELESAI' },
]

/** arus waterfall: sweep autodebet kreator terbaru lintas pool */
export const sweeps: Sweep[] = [
  { id: 'SW-218', creator: 'Dimas Anggara', channel: 'OtoReview ID', earningsMonth: 'Agu 2026', amount: 9_843_500, sweptAt: '2026-09-21' },
  { id: 'SW-217', creator: 'Bagas Pradiyo', channel: 'Dapur Bagas', earningsMonth: 'Agu 2026', amount: 12_741_000, sweptAt: '2026-09-21' },
  { id: 'SW-216', creator: 'Sarah Kirana', channel: 'Kirana Beauty', earningsMonth: 'Agu 2026', amount: 7_216_800, sweptAt: '2026-09-22' },
  { id: 'SW-215', creator: 'Yoga Pratama', channel: 'YogaMain', earningsMonth: 'Agu 2026', amount: 15_082_200, sweptAt: '2026-09-21' },
  { id: 'SW-214', creator: 'Nadia Rahmawati', channel: 'NadiaBaca', earningsMonth: 'Agu 2026', amount: 5_409_900, sweptAt: '2026-09-23' },
  { id: 'SW-213', creator: 'Fajar Hidayat', channel: 'FajarFutsal', earningsMonth: 'Agu 2026', amount: 6_733_400, sweptAt: '2026-09-21' },
  { id: 'SW-212', creator: 'Intan Permata', channel: 'Intan Homes', earningsMonth: 'Agu 2026', amount: 11_247_600, sweptAt: '2026-09-22' },
  { id: 'SW-211', creator: 'Rizky Maulana', channel: 'Maulana Tech', earningsMonth: 'Agu 2026', amount: 8_594_100, sweptAt: '2026-09-21' },
  { id: 'SW-210', creator: 'Ayu Lestari', channel: 'Ayu Sewing', earningsMonth: 'Agu 2026', amount: 4_318_700, sweptAt: '2026-09-24' },
  { id: 'SW-209', creator: 'Bimo Setiawan', channel: 'Bimo Fishing', earningsMonth: 'Agu 2026', amount: 9_065_300, sweptAt: '2026-09-21' },
]
