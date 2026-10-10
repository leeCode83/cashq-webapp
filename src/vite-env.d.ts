/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** appid project di zkPass DevHub */
  readonly VITE_ZKPASS_APPID: string
  /** schemaId schema custom di zkPass DevHub */
  readonly VITE_ZKPASS_SCHEMA_ID: string
  /** App ID publik Privy (dashboard.privy.io) — aman diekspos ke browser */
  readonly VITE_PRIVY_APP_ID: string
  /** Private key wallet owner untuk mint faucet & sweep — TESTNET SAJA */
  readonly VITE_OWNER_PRIVATE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
