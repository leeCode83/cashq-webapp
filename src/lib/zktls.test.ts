import { describe, expect, it } from 'vitest'
import { decideFromProof, evaluateAdvance, maxAdvance, verifyProof, type ZkProof } from './zktls'

describe('maxAdvance', () => {
  it('floor 8.400.000, default pajak 20% + tier 90% → 6.048.000', () => {
    expect(maxAdvance(8_400_000)).toBe(6_048_000)
  })

  it('tier kreator baru 70% → 4.704.000', () => {
    expect(maxAdvance(8_400_000, 0.2, 0.7)).toBe(4_704_000)
  })

  it('floor nol → nol', () => {
    expect(maxAdvance(0)).toBe(0)
  })
})

describe('evaluateAdvance', () => {
  it('R = batas maksimum → lolos (inklusif)', () => {
    expect(evaluateAdvance(6_048_000, 8_400_000)).toEqual({
      approved: true,
      max: 6_048_000,
      reason: 'lolos',
    })
  })

  it('R = batas maksimum + 1 → tolak dengan reason melebihi-batas', () => {
    expect(evaluateAdvance(6_048_001, 8_400_000)).toEqual({
      approved: false,
      max: 6_048_000,
      reason: 'melebihi-batas',
    })
  })
})

// fixture ECDSA dari key buangan (validator key 0x11…32, allocator key 0x22…32),
// di-tandatangani sekali di luar module — sumber kebenaran independen.
const FIXTURE: ZkProof = {
  taskId: 'b48112cbafed46159fd0455f182c5941',
  schemaId: '00f2c96d3cbc437ca2e80b459a29973b',
  uHash: '0xcfd4647355c0799dad8f9422476f788e35143de86c88b422229e9df198f88cec',
  publicFieldsHash: '0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6',
  allocatorAddress: '0x1563915e194D8CfBA1943570603F7606A3115508',
  allocatorSignature:
    '0xf40915648529d7d463f7ee891849d59c81c3c04a7a11a560fcb1c754341188731a9d20de9a0b07ee2e0029e021f479805906d080fdf9e19bb64fa99a09af0f111b',
  validatorAddress: '0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A',
  validatorSignature:
    '0x16681864ee6f19ed22ceaf3f687d9c5a1ac70f56711e5dd8b5338d3caed9776d05f831cf203a1ee08277d724979bddcb147979e88fa50ef2064fd7224b968b511b',
  recipient: '0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A',
}

/** ubah satu karakter hex di tengah (area r) — bentuk tanda tangan tetap sah, isinya berubah */
const tamper = (s: string) => s.slice(0, 10) + (s[10] === '0' ? '1' : '0') + s.slice(11)

describe('verifyProof', () => {
  const opts = { allocatorAddress: FIXTURE.allocatorAddress }

  it('proof utuh → ok dengan floor schema', async () => {
    expect(await verifyProof(FIXTURE, opts)).toEqual({ ok: true, floor: 8_400_000, uHash: FIXTURE.uHash })
  })

  it('recipient cocok → ok', async () => {
    expect((await verifyProof(FIXTURE, { ...opts, expectedRecipient: FIXTURE.recipient })).ok).toBe(true)
  })

  it('tanda tangan validator dipalsukan → tolak', async () => {
    expect(await verifyProof({ ...FIXTURE, validatorSignature: tamper(FIXTURE.validatorSignature) }, opts)).toEqual({
      ok: false,
      reason: 'tanda-tangan-validator-tidak-valid',
    })
  })

  it('uHash diubah → tolak (hash params tidak cocok tanda tangan)', async () => {
    expect(await verifyProof({ ...FIXTURE, uHash: tamper(FIXTURE.uHash) }, opts)).toEqual({
      ok: false,
      reason: 'tanda-tangan-validator-tidak-valid',
    })
  })

  it('tanda tangan allocator dipalsukan → tolak', async () => {
    expect(await verifyProof({ ...FIXTURE, allocatorSignature: tamper(FIXTURE.allocatorSignature) }, opts)).toEqual({
      ok: false,
      reason: 'tanda-tangan-allocator-tidak-valid',
    })
  })

  it('tanpa opts: tanda tangan allocator tidak cocok allocator resmi zkPass → tolak', async () => {
    expect(await verifyProof(FIXTURE)).toEqual({ ok: false, reason: 'tanda-tangan-allocator-tidak-valid' })
  })

  it('schemaId tak dikenal → tolak', async () => {
    expect(await verifyProof({ ...FIXTURE, schemaId: 'f'.repeat(32) }, opts)).toEqual({
      ok: false,
      reason: 'schema-tak-dikenal',
    })
  })

  it('alamat allocator asing → tolak', async () => {
    expect(
      await verifyProof({ ...FIXTURE, allocatorAddress: '0x0000000000000000000000000000000000000001' }, opts),
    ).toEqual({ ok: false, reason: 'allocator-tidak-dikenal' })
  })

  it('recipient tidak cocok → tolak', async () => {
    expect(
      await verifyProof(FIXTURE, { ...opts, expectedRecipient: '0x0000000000000000000000000000000000000002' }),
    ).toEqual({ ok: false, reason: 'recipient-tidak-cocok' })
  })
})

describe('decideFromProof', () => {
  const opts = { allocatorAddress: FIXTURE.allocatorAddress }

  it('proof dipalsukan → bukti-tidak-valid tanpa throw', async () => {
    expect(await decideFromProof({ ...FIXTURE, uHash: tamper(FIXTURE.uHash) }, 1_000_000, opts)).toEqual({
      approved: false,
      max: 0,
      reason: 'bukti-tidak-valid',
    })
  })

  it('proof sah + R dalam batas → disetujui dengan max kebijakan', async () => {
    expect(await decideFromProof(FIXTURE, 5_000_000, opts)).toEqual({
      approved: true,
      max: 6_048_000,
      reason: 'lolos',
    })
  })

  it('proof sah + R melebihi batas → ditolak', async () => {
    expect((await decideFromProof(FIXTURE, 6_048_001, opts)).reason).toBe('melebihi-batas')
  })
})
