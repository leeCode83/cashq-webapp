/**
 * Konversi unit uang: kontrak IDRX memakai 6 desimal (mengikuti IDRX asli),
 * UI memakai angka rupiah biasa. Jangan dicampur — `raw()` untuk argumen
 * kontrak, `idr()` untuk menampilkan.
 */
import { formatUnits, parseUnits } from 'viem'

/** Desimal IDRX di kontrak. */
export const D6 = 6

/** Rupiah (angka atau string) → unit mentah kontrak. */
export function raw(rupiah: string | number): bigint {
  return parseUnits(String(rupiah), D6)
}

/** Unit mentah kontrak → rupiah (angka). */
export function idr(nilai: bigint): number {
  return Number(formatUnits(nilai, D6))
}

/** Fee advance sesuai rumus kontrak: principal × 275 / 10000 (unit mentah, floor). */
export function feeOf(principal: bigint): bigint {
  return (principal * 275n) / 10000n
}
