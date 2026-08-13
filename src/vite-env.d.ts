/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly OPENAI_API_KEY?: string
  readonly OPENAI_MODEL?: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_OPENAI_MODEL?: string
  readonly OPENROUTER_API_KEY?: string
  readonly OPENROUTER_MODEL?: string
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_OPENROUTER_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
