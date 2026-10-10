/**
 * Jadwal payout Google: saldo final diposting tgl 3, advance terbuka sampai
 * tgl 20, payout dibayar 21–26. `dueAt` advance = tgl 21 terdekat berikutnya.
 */

/** Detik epoch tgl 21 bulan berjalan — atau bulan depan bila sudah lewat tgl 20. */
export function dueAtPayout(now: Date = new Date()): number {
  const bulanLewat = now.getDate() > 20 ? 1 : 0
  return Math.floor(new Date(now.getFullYear(), now.getMonth() + bulanLewat, 21).getTime() / 1000)
}
