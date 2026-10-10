/**
 * ABI minimal kontrak CashQ, ditulis dari sumber `cashq-sc/src/*.sol`
 * (sudah terverifikasi di Base Sepolia). Kalau kontrak berubah, ganti dari
 * hasil `forge build`: `cashq-sc/out/<Nama>.sol/<Nama>.json` (field `abi`).
 */
import { parseAbi } from 'viem'

/** Mock stablecoin IDRX — 6 desimal, faucet `mint` hanya owner. */
export const idrxAbi = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount)',
])

/** Registri nullifier — frontend hanya baca; `register` dipanggil vault. */
export const registryAbi = parseAbi([
  'function isUsed(bytes32 nullifier) view returns (bool)',
  'function fundedBy(bytes32 nullifier) view returns (address)',
])

/**
 * CashQVault — pool LP ERC-4626 + advance.
 * Fee 2,75% & min Rp500.000 dipatok di frontend (konstanta `mock.ts`),
 * jadi `FEE_BPS`/`MIN_ADVANCE` tidak masuk ABI.
 */
export const vaultAbi = parseAbi([
  'function deposit(uint256 assets, address receiver) returns (uint256)',
  'function withdraw(uint256 assets, address receiver, address owner) returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function convertToAssets(uint256 shares) view returns (uint256)',
  'function totalAssets() view returns (uint256)',
  'function outstanding() view returns (uint256)',
  'function advanceCount() view returns (uint256)',
  'function advances(uint256 id) view returns (address creator, bytes32 nullifier, uint256 principal, uint256 fee, uint64 dueAt, bool swept)',
  'function advanceIdsOf(address who) view returns (uint256[])',
  'function getCredit(address who) view returns ((uint256 advanceId, uint256 amount, uint64 at)[])',
  'function requestAdvance(bytes32 nullifier, uint256 principal, uint64 dueAt) returns (uint256 id)',
  'function sweep(uint256 id)',
  'event Advanced(uint256 indexed id, address indexed creator, bytes32 indexed nullifier, uint256 principal, uint256 fee)',
  'event Swept(uint256 indexed id, address indexed creator, uint256 amount)',
])
