import { describe, expect, it } from 'vitest'
import type { Log } from 'viem'
import { encodeAbiParameters, encodeEventTopics, parseAbiParameters, zeroAddress } from 'viem'
import { vaultAbi } from './abis'
import { advanceIdDariReceipt } from './contract-writes'

/** Log buatan dari event `Advanced` — encodeEventTopics memastikan topik valid. */
function logAdvanced(id: bigint): Log {
  const hex32 = `0x${'11'.repeat(32)}` as const
  const topics = encodeEventTopics({
    abi: vaultAbi,
    eventName: 'Advanced',
    args: { id, creator: zeroAddress, nullifier: hex32 },
  })
  return {
    address: zeroAddress,
    topics: topics as [`0x${string}`, ...`0x${string}`[]],
    // principal & fee tidak terindeks → hidup di data
    data: encodeAbiParameters(parseAbiParameters('uint256, uint256'), [500_000n, 13_750n]),
    blockNumber: 1n,
    blockHash: hex32,
    transactionHash: hex32,
    transactionIndex: 0,
    logIndex: 0,
    removed: false,
  }
}

describe('advanceIdDariReceipt', () => {
  it('mengambil id dari event Advanced', () => {
    expect(advanceIdDariReceipt({ logs: [logAdvanced(7n)] })).toBe(7n)
  })

  it('error jelas bila event tidak ada', () => {
    expect(() => advanceIdDariReceipt({ logs: [] })).toThrow('Advanced')
  })
})
