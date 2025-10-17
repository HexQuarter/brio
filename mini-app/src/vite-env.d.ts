/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BREEZ_API_KEY: string
    readonly BACKEND_ENDPOINT: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}