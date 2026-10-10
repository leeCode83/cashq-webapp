import { describe, expect, it } from 'vitest'
import type { Abi, AbiEvent, AbiFunction } from 'viem'
import { idrxAbi, registryAbi, vaultAbi } from './abis'

/** Nama entri `function` dalam satu ABI. */
const fns = (abi: Abi) => abi.filter((i): i is AbiFunction => i.type === 'function').map((i) => i.name)

/** Nama entri `event` dalam satu ABI. */
const events = (abi: Abi) => abi.filter((i): i is AbiEvent => i.type === 'event').map((i) => i.name)

/** Asap ABI: fungsi wajib harus ada supaya panggilan runtime tidak gagal diam-diam. */
describe('abis', () => {
  it('idrx punya erc20 dasar + faucet mint', () => {
    expect(fns(idrxAbi)).toEqual(expect.arrayContaining(['balanceOf', 'approve', 'mint']))
  })

  it('registry bisa dicek isUsed & fundedBy', () => {
    expect(fns(registryAbi)).toEqual(expect.arrayContaining(['isUsed', 'fundedBy']))
  })

  it('vault punya lengkap siklus LP-advance-sweep + event', () => {
    expect(fns(vaultAbi)).toEqual(
      expect.arrayContaining([
        'deposit',
        'withdraw',
        'convertToAssets',
        'totalAssets',
        'outstanding',
        'advanceCount',
        'advances',
        'advanceIdsOf',
        'getCredit',
        'requestAdvance',
        'sweep',
      ]),
    )
    expect(events(vaultAbi)).toEqual(expect.arrayContaining(['Advanced', 'Swept']))
  })
})
