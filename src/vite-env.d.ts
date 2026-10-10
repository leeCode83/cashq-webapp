/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** appid project di zkPass DevHub */
  readonly VITE_ZKPASS_APPID: string
  /** schemaId schema custom di zkPass DevHub */
  readonly VITE_ZKPASS_SCHEMA_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
