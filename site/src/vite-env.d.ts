/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_BASE_RPC?: string;
  readonly VITE_BASE_SEPOLIA_RPC?: string;
  /** 지갑 dApp 서브도메인 (app.assawave.io) */
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
