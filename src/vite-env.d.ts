/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** appid project di zkPass DevHub */
  readonly VITE_ZKPASS_APPID: string
  /** schemaId schema custom di zkPass DevHub */
  readonly VITE_ZKPASS_SCHEMA_ID: string
  /** App ID publik Privy (dashboard.privy.io) — aman diekspos ke browser */
  readonly VITE_PRIVY_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
