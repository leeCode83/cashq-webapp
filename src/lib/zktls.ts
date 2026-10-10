// Service zkTLS CashQ — verifikasi bukti zkPass TransGate + kebijakan advance.
// Sumber aturan: docs/42-cashq.md (batas keras di bawah pajak, baris 74).
// Algoritma tanda tangan mengikuti docs zkPass "Generate proof and verify (EVM)":
// paramsHash = keccak256(abiEncode([taskId, schemaId, ...])) lalu recover alamat penandatangan.

import { encodeAbiParameters, keccak256, recoverAddress, stringToHex } from 'viem'
import type { Address, Hex } from 'viem'
import TransgateConnect from '@zkpass/transgate-js-sdk'

/** tautan pemasangan ekstensi TransGate di Chrome Web Store */
export const TRANSGATE_INSTALL_URL =
  'https://chromewebstore.google.com/detail/zkpass-transgate/afkoofjocpbclhnldmmaphappihehpma'

/** appid project zkPass DevHub — dari .env (lihat .env.example); kosong kalau belum diisi */
export const ZK_APPID = import.meta.env.VITE_ZKPASS_APPID ?? ''

/** schemaId schema custom zkPass — dari .env (lihat .env.example); kosong kalau belum diisi */
export const ZK_SCHEMA_ID = import.meta.env.VITE_ZKPASS_SCHEMA_ID ?? ''

/** alamat allocator node resmi zkPass (dokumentasi EVM zkPass) */
export const ZK_ALLOCATOR_ADDRESS = '0x19a567b3b212a5b35bA0E3B600FbEd5c2eE9083d'

/** ambang saldo final yang diattest schema: proof lolos = saldo >= nilai ini (IDRX) */
export const SCHEMA_FLOOR = 8_400_000

/** bukti zkTLS mentah yang dikembalikan ekstensi TransGate via SDK */
export interface ZkProof {
  /** id tugas unik dari allocator node (32 karakter hex) */
  taskId: string
  /** schemaId schema yang dipakai — harus sama dengan ZK_SCHEMA_ID */
  schemaId: string
  /** hash id unik user di sumber data (dari nullifier `payment_id`) — anti didanai ganda */
  uHash: string
  /** hash nilai public fields (kosong untuk schema kita) */
  publicFieldsHash: string
  /** alamat allocator node yang menandatangani meta tugas */
  allocatorAddress: string
  /** tanda tangan allocator atas meta tugas */
  allocatorSignature: string
  /** alamat validator node yang memverifikasi zk-proof */
  validatorAddress: string
  /** tanda tangan validator atas hasil verifikasi */
  validatorSignature: string
  /** wallet kreator yang di-ikat ke proof (ada kalau launch() diberi address) */
  recipient?: string
  /** nilai public fields yang dibuka (kosong untuk schema kita) */
  publicFields?: Record<string, unknown>
}

/** hasil verifikasi proof: gagal selalu beralasan, tidak pernah melempar error */
export type VerifyResult =
  | { ok: true; /** ambang saldo ter-attest (IDRX) */ floor: number; uHash: string }
  | { ok: false; reason: VerifyFailReason }

/** alasan proof ditolak — tampil ke user lewat pemetaan pesan di UI */
export type VerifyFailReason =
  | 'schema-tak-dikenal'
  | 'bentuk-bukti-tidak-valid'
  | 'tanda-tangan-allocator-tidak-valid'
  | 'tanda-tangan-validator-tidak-valid'
  | 'allocator-tidak-dikenal'
  | 'recipient-tidak-cocok'

/** bandingkan alamat tanpa peduli kapitalisasi checksum */
const eqAddr = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * Verifikasi keaslian bukti zkTLS — murni & sinkron, tidak pernah throw.
 * Membuktikan: tanda tangan allocator berasal dari node resmi zkPass, tanda tangan
 * validator konsisten dengan isi proof, proof memang untuk schema kita, dan (opsional)
 * proof terikat ke wallet kreator yang diharapkan. Tidak membuktikan nominal persis —
 * hanya ambang (lihat SCHEMA_FLOOR).
 *
 * @param proof bukti mentah dari `launchVerification()`
 * @param opts.allocatorAddress alamat allocator pengganti untuk pengujian; default allocator resmi zkPass
 * @param opts.expectedRecipient wallet kreator yang diharapkan — ikatan recipient diverifikasi bila diisi
 * @returns `{ ok: true, floor, uHash }` bila sah, `{ ok: false, reason }` bila tidak
 */
export const verifyProof = async (
  proof: ZkProof,
  opts: { allocatorAddress?: string; expectedRecipient?: string } = {},
): Promise<VerifyResult> => {
  if (proof.schemaId !== ZK_SCHEMA_ID) return { ok: false, reason: 'schema-tak-dikenal' }
  const allocator = opts.allocatorAddress ?? ZK_ALLOCATOR_ADDRESS
  try {
    const task = stringToHex(proof.taskId)
    const schema = stringToHex(ZK_SCHEMA_ID)
    const b32 = { type: 'bytes32' } as const
    const allocHash = keccak256(
      encodeAbiParameters([b32, b32, { type: 'address' }], [
        task,
        schema,
        proof.validatorAddress as Address,
      ]),
    )
    const signedAllocator = await recoverAddress({ hash: allocHash, signature: proof.allocatorSignature as Hex })
    if (!eqAddr(signedAllocator, allocator)) return { ok: false, reason: 'tanda-tangan-allocator-tidak-valid' }

    const valHash = proof.recipient
      ? keccak256(
          encodeAbiParameters([b32, b32, b32, b32, { type: 'address' }], [
            task,
            schema,
            proof.uHash as Hex,
            proof.publicFieldsHash as Hex,
            proof.recipient as Address,
          ]),
        )
      : keccak256(
          encodeAbiParameters([b32, b32, b32, b32], [task, schema, proof.uHash as Hex, proof.publicFieldsHash as Hex]),
        )
    const signedValidator = await recoverAddress({ hash: valHash, signature: proof.validatorSignature as Hex })
    if (!eqAddr(signedValidator, proof.validatorAddress))
      return { ok: false, reason: 'tanda-tangan-validator-tidak-valid' }
  } catch {
    return { ok: false, reason: 'bentuk-bukti-tidak-valid' }
  }
  if (!eqAddr(proof.allocatorAddress, allocator)) return { ok: false, reason: 'allocator-tidak-dikenal' }
  if (opts.expectedRecipient && (!proof.recipient || !eqAddr(proof.recipient, opts.expectedRecipient)))
    return { ok: false, reason: 'recipient-tidak-cocok' }
  return { ok: true, floor: SCHEMA_FLOOR, uHash: proof.uHash }
}

/**
 * Hitung advance maksimum dari ambang saldo ter-attest.
 * Rumus: floor × (1 − pajak) × persen tier, dibulatkan.
 *
 * @param floor ambang saldo final ter-attest (IDRX), bukan saldo persis
 * @param taxRate estimasi pajak AS di muka (default 0,2 — fallback docs)
 * @param tierPct persen tier kreator (default 0,9 — histori baik; kreator baru 0,7)
 * @returns advance maksimum dalam IDRX
 */
export const maxAdvance = (floor: number, taxRate = 0.2, tierPct = 0.9): number =>
  Math.round(floor * (1 - taxRate) * tierPct)

/** keputusan advance: disetujui atau alasan penolakannya */
export interface AdvanceDecision {
  approved: boolean
  /** advance maksimum menurut kebijakan (IDRX) */
  max: number
  reason: 'lolos' | 'melebihi-batas' | 'bukti-tidak-valid'
}

/**
 * Putuskan permintaan advance terhadap ambang saldo ter-attest.
 * R ≤ batas disetujui (inklusif); melebihi ditolak.
 *
 * @param requested dana advance yang diminta kreator (IDRX)
 * @param floor ambang saldo final ter-attest (IDRX)
 * @param taxRate estimasi pajak AS di muka (default 0,2)
 * @param tierPct persen tier kreator (default 0,9)
 */
export const evaluateAdvance = (
  requested: number,
  floor: number,
  taxRate = 0.2,
  tierPct = 0.9,
): AdvanceDecision => {
  const max = maxAdvance(floor, taxRate, tierPct)
  return requested <= max
    ? { approved: true, max, reason: 'lolos' }
    : { approved: false, max, reason: 'melebihi-batas' }
}

/**
 * Orkestrator keputusan advance — penjaga trust boundary: keputusan HANYA lahir
 * dari proof yang terverifikasi. Proof gagal → 'bukti-tidak-valid' dengan max 0,
 * evaluasi kebijakan tidak pernah disentuh.
 *
 * @param proof bukti mentah dari `launchVerification()`
 * @param requested dana advance yang diminta kreator (IDRX)
 * @param opts dilempar langsung ke `verifyProof()`
 */
export const decideFromProof = async (
  proof: ZkProof,
  requested: number,
  opts: { allocatorAddress?: string; expectedRecipient?: string } = {},
): Promise<AdvanceDecision> => {
  const v = await verifyProof(proof, opts)
  if (!v.ok) return { approved: false, max: 0, reason: 'bukti-tidak-valid' }
  return evaluateAdvance(requested, v.floor)
}

/**
 * Buka sesi verifikasi zkTLS lewat ekstensi TransGate.
 * SEAM EKSTENSI BROWSER — tidak di-unit-test; uji manual: install TransGate di Chrome,
 * panggil dari UI, selesaikan popup verifikasi, lalu cek hasilnya dengan `verifyProof()`.
 * Field bukti yang tidak lengkap dikembalikan sebagai string kosong — akan ditolak
 * `verifyProof()` dengan 'bentuk-bukti-tidak-valid', jadi wrapper ini tidak pernah
 * menghasilkan bukti yang lolos verifikasi secara diam-diam.
 *
 * Melempar Error berpesan siap-tampil bila: env zkPass kosong, ekstensi belum
 * terpasang (link install disertakan), atau proses dibatalkan/gagal di sisi SDK.
 *
 * @param walletAddress wallet kreator untuk mengikat proof (recipient) — kosongkan bila tidak perlu
 * @returns bukti mentah siap diverifikasi dengan `verifyProof()`
 */
export const launchVerification = async (walletAddress?: string): Promise<ZkProof> => {
  if (!ZK_APPID || !ZK_SCHEMA_ID)
    throw new Error('Env zkPass kosong — isi VITE_ZKPASS_APPID & VITE_ZKPASS_SCHEMA_ID di .env (lihat .env.example)')
  const connector = new TransgateConnect(ZK_APPID)
  if (!(await connector.isTransgateAvailable()))
    throw new Error(`Ekstensi zkPass TransGate belum terpasang — install di ${TRANSGATE_INSTALL_URL}`)
  try {
    const res = (await connector.launch(ZK_SCHEMA_ID, walletAddress)) as Partial<ZkProof>
    return {
      taskId: res.taskId ?? '',
      schemaId: ZK_SCHEMA_ID,
      uHash: res.uHash ?? '',
      publicFieldsHash: res.publicFieldsHash ?? '',
      allocatorAddress: res.allocatorAddress ?? '',
      allocatorSignature: res.allocatorSignature ?? '',
      validatorAddress: res.validatorAddress ?? '',
      validatorSignature: res.validatorSignature ?? '',
      recipient: res.recipient ?? undefined,
      publicFields: res.publicFields ?? undefined,
    }
  } catch (e) {
    throw new Error(`Verifikasi TransGate gagal: ${e instanceof Error ? e.message : String(e)}`, { cause: e })
  }
}
