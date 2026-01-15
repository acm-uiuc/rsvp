interface ImportMetaEnv {
  readonly VITE_AAD_CLIENT_ID: string;
  readonly VITE_AAD_AUTHORITY: string;
  readonly VITE_TURNSTILE_DEV_KEY: string;
  readonly VITE_TURNSTILE_PROD_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}