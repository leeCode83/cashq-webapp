// Format uang & tanggal untuk tampilan buku besar. IDRX = stablecoin Rupiah (1 IDRX = 1 IDR).

export const fmtIDRX = (n: number) => `IDRX ${Math.round(n).toLocaleString('id-ID')}`

export const fmtNum = (n: number) => Math.round(n).toLocaleString('id-ID')

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

export const fmtDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export const fmtPct = (n: number) => `${n.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
export const monthLabel = (iso: string) => {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

/** hash tampilan untuk bukti/nullifier; bukan kriptografi, hanya identitas visual */
export const pseudoHash = (seed: string, len = 40) => {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  let out = ''
  while (out.length < len) {
    h = Math.imul(h ^ (h >>> 13), 0x01000193)
    out += (h >>> 0).toString(16).padStart(8, '0')
  }
  return `0x${out.slice(0, len)}`
}

export const shortHash = (h: string) => `${h.slice(0, 8)}…${h.slice(-6)}`
