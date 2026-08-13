const KEY = 'gymbuddy-llm-settings-v1'

export type LlmProviderId = 'openai' | 'openrouter'

export interface LlmSettings {
  openaiApiKey: string
  openaiModel: string
  openrouterApiKey: string
  openrouterModel: string
  /** Used only when both keys are present. Default ChatGPT. */
  preferredProvider: LlmProviderId
  enabled: boolean
}

export type ResolvedLlm =
  | { kind: 'openai'; apiKey: string; model: string; label: string }
  | { kind: 'openrouter'; apiKey: string; model: string; label: string }
  | { kind: 'local'; label: string }

export const OPENAI_MODELS = [
  { id: 'gpt-5.6-luna', label: 'gpt-5.6-luna' },
  { id: 'gpt-5.4-mini', label: 'gpt-5.4-mini' },
  { id: 'gpt-5.4-nano', label: 'gpt-5.4-nano' },
  { id: 'gpt-5-mini', label: 'gpt-5-mini' },
  { id: 'gpt-5-nano', label: 'gpt-5-nano' },
] as const

export const OPENROUTER_AUTO = 'openrouter/auto'

function envOpenAiKey(): string {
  return (
    import.meta.env.OPENAI_API_KEY?.trim() ||
    import.meta.env.VITE_OPENAI_API_KEY?.trim() ||
    ''
  )
}

function envOpenRouterKey(): string {
  return (
    import.meta.env.OPENROUTER_API_KEY?.trim() ||
    import.meta.env.VITE_OPENROUTER_API_KEY?.trim() ||
    ''
  )
}

export function envOpenAiModel(): string {
  const env =
    import.meta.env.OPENAI_MODEL?.trim() ||
    import.meta.env.VITE_OPENAI_MODEL?.trim() ||
    ''
  return OPENAI_MODELS.some((m) => m.id === env) ? env : 'gpt-5.6-luna'
}

export function envOpenRouterModel(): string {
  return OPENROUTER_AUTO
}

function snapOpenAiModel(id: string | undefined): string {
  const next = id?.trim() || ''
  if (OPENAI_MODELS.some((m) => m.id === next)) return next
  return envOpenAiModel()
}

const DEFAULTS: LlmSettings = {
  openaiApiKey: '',
  openaiModel: envOpenAiModel(),
  openrouterApiKey: '',
  openrouterModel: envOpenRouterModel(),
  preferredProvider: 'openai',
  enabled: true,
}

interface LegacyLlmSettings {
  apiKey?: string
  model?: string
  openaiApiKey?: string
  openaiModel?: string
  openrouterApiKey?: string
  openrouterModel?: string
  preferredProvider?: LlmProviderId
  enabled?: boolean
}

function normalize(parsed: LegacyLlmSettings): LlmSettings {
  const openaiApiKey = parsed.openaiApiKey?.trim() || parsed.apiKey?.trim() || envOpenAiKey()
  const openrouterApiKey = parsed.openrouterApiKey?.trim() || envOpenRouterKey()
  return {
    ...DEFAULTS,
    ...parsed,
    openaiApiKey,
    openaiModel: snapOpenAiModel(parsed.openaiModel || parsed.model),
    openrouterApiKey,
    openrouterModel: OPENROUTER_AUTO,
    preferredProvider: parsed.preferredProvider === 'openrouter' ? 'openrouter' : 'openai',
    enabled: parsed.enabled !== false,
  }
}

export function loadLlmSettings(): LlmSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return normalize({})
    }
    return normalize(JSON.parse(raw) as LegacyLlmSettings)
  } catch {
    return normalize({})
  }
}

export function saveLlmSettings(settings: LlmSettings): LlmSettings {
  const next = normalize(settings)
  localStorage.setItem(
    KEY,
    JSON.stringify({
      openaiApiKey: next.openaiApiKey.trim(),
      openaiModel: snapOpenAiModel(next.openaiModel),
      openrouterApiKey: next.openrouterApiKey.trim(),
      openrouterModel: OPENROUTER_AUTO,
      preferredProvider: next.preferredProvider,
      enabled: next.enabled,
    }),
  )
  return next
}

export function resolveLlm(settings = loadLlmSettings()): ResolvedLlm {
  if (!settings.enabled) {
    return { kind: 'local', label: '本地規則' }
  }
  const gpt = settings.openaiApiKey.trim()
  const or = settings.openrouterApiKey.trim()
  if (gpt && or) {
    return settings.preferredProvider === 'openrouter'
      ? {
          kind: 'openrouter',
          apiKey: or,
          model: OPENROUTER_AUTO,
          label: 'OpenRouter',
        }
      : {
          kind: 'openai',
          apiKey: gpt,
          model: snapOpenAiModel(settings.openaiModel),
          label: 'ChatGPT',
        }
  }
  if (gpt) {
    return {
      kind: 'openai',
      apiKey: gpt,
      model: snapOpenAiModel(settings.openaiModel),
      label: 'ChatGPT',
    }
  }
  if (or) {
    return {
      kind: 'openrouter',
      apiKey: or,
      model: OPENROUTER_AUTO,
      label: 'OpenRouter',
    }
  }
  return { kind: 'local', label: '本地規則' }
}

export function hasLlmConfigured(settings = loadLlmSettings()): boolean {
  return resolveLlm(settings).kind !== 'local'
}

export function llmStatusText(settings = loadLlmSettings()): string {
  const active = resolveLlm(settings)
  if (active.kind === 'local') return '未貼 API key，排課會用本地規則。'
  if (active.kind === 'openai') return `而家用 ChatGPT · ${active.model}`
  return '而家用 OpenRouter（自動揀 model）'
}
