# CashQ Webapp

YouTube creators wait until the 21st of every month before their AdSense money is usable. CashQ turns an AdSense payout that has not landed yet into an advance today: the creator proves their earnings with zkTLS, a smart contract funds the advance from a liquidity pool, and when the real payout arrives, the contract pulls it back automatically (sweep).

This repo holds the webapp. The smart contracts live in a separate repo: [leeCode83/cashq-sc](https://github.com/leeCode83/cashq-sc).

## How it works

1. The creator logs in (Privy), then runs a zkPass schema in TransGate to prove what their AdSense dashboard shows without handing over their Google credentials.
2. The frontend verifies the zkPass proof, calculates the advance, and calls `requestAdvance` on the contract with the `uHash` nullifier of that payout.
3. The [`CashQVault`](https://github.com/leeCode83/cashq-sc) contract sends IDR from an ERC-4626 pool. The nullifier is registered in `NullifierRegistry`, so the same payout cannot be funded twice.
4. On the 21st, Google's payout lands in the creator's wallet and the vault owner runs `sweep` (auto-debit). A flat 2.75% fee from each sweep flows back into the pool, so LP share price rises and LP yield accrues with no separate distribution code.

## Setup

```bash
git clone https://github.com/leeCode83/cashq-webapp.git
cd cashq-webapp
npm install
cp .env.example .env
npm run dev
```

Fill in `.env` (see `.env.example` for details):

| Variable | Source |
|---|---|
| `VITE_ZKPASS_APPID`, `VITE_ZKPASS_SCHEMA_ID` | [zkPass DevHub](https://dev.zkpass.org) |
| `VITE_PRIVY_APP_ID` | [Privy dashboard](https://dashboard.privy.io) (public App ID, safe in the browser) |
| `VITE_OWNER_PRIVATE_KEY` | The vault owner's wallet key, testnet or local node only |

The webapp runs without deploying contracts yourself. If you want the full flow on a local chain, follow the `anvil` deploy instructions in the [cashq-sc repo](https://github.com/leeCode83/cashq-sc#readme) and copy the addresses from `exports/addresses.json`.

## Commands

```bash
npm run dev        # dev server
npm run build      # tsc + vite build
npm test           # vitest
npm run lint       # eslint
npm run typecheck  # tsc -b
```

## Tech stack

- **UI**: React 19 + TypeScript, Vite, Tailwind CSS 4, Motion for animation, React Router 7 for pages
- **Wallet & auth**: Privy (`@privy-io/react-auth`) for login and embedded or external wallets
- **zkTLS**: `@zkpass/transgate-js-sdk` to request and verify the AdSense proof, viem's `recoverMessageAddress` to recover the allocator signature
- **Onchain**: viem for contract calls, against the [cashq-sc](https://github.com/leeCode83/cashq-sc) contracts (`CashQVault` ERC-4626, `NullifierRegistry`, mock `IDRX` stablecoin)
- **Forms & numbers**: `react-number-format` for money inputs, `@number-flow/react` for animated figures, Sonner for toasts
- **Testing & quality**: Vitest + Testing Library (jsdom), ESLint, `tsc -b` typecheck, React Compiler enabled at build time

## Note

`VITE_OWNER_PRIVATE_KEY` is readable by anyone from the web bundle. Use it only with a wallet that holds no funds.
