// Polyfill Node Buffer untuk dep web3 (SDK zkPass TransGate / @ton) yang memakai
// global Buffer di browser. Harus di-import PALING AWAL di main.tsx, sebelum App —
// urutan import ESM menjamin shim terpasang sebelum modul SDK dievaluasi.
import { Buffer } from 'buffer'

;(globalThis as unknown as { Buffer: unknown }).Buffer ??= Buffer
