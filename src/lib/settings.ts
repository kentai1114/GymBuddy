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
  { id: 'gpt-4o-mini', label: 'gpt-4o-mini' },
] as const

export const OPENROUTER_MODELS = [
  { id: 'openrouter/auto', label: 'Auto' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini' },
  { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet' },
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini Flash' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 (free)' },
] as const

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
  return (
    import.meta.env.OPENAI_MODEL?.trim() ||
    import.meta.env.VITE_OPENAI_MODEL?.trim() ||
    'gpt-5.6-luna'
  )
}

export function envOpenRouterModel(): string {
  return (
    import.meta.env.OPENROUTER_MODEL?.trim() ||
    import.meta.env.VITE_OPENROUTER_MODEL?.trim() ||
    'openrouter/auto'
  )
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
    openaiModel: parsed.openaiModel?.trim() || parsed.model?.trim() || envOpenAiModel(),
    openrouterApiKey,
    openrouterModel: parsed.openrouterModel?.trim() || envOpenRouterModel(),
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

export function saveLlmSettings(settings: LlmSettings): void {
  const next = normalize(settings)
  localStorage.setItem(
    KEY,
    JSON.stringify({
      openaiApiKey: next.openaiApiKey.trim(),
      openaiModel: next.openaiModel.trim() || envOpenAiModel(),
      openrouterApiKey: next.openrouterApiKey.trim(),
      openrouterModel: next.openrouterModel.trim() || envOpenRouterModel(),
      preferredProvider: next.preferredProvider,
      enabled: next.enabled,
    }),
  )
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
          model: settings.openrouterModel.trim() || envOpenRouterModel(),
          label: 'OpenRouter',
        }
      : {
          kind: 'openai',
          apiKey: gpt,
          model: settings.openaiModel.trim() || envOpenAiModel(),
          label: 'ChatGPT',
        }
  }
  if (gpt) {
    return {
      kind: 'openai',
      apiKey: gpt,
      model: settings.openaiModel.trim() || envOpenAiModel(),
      label: 'ChatGPT',
    }
  }
  if (or) {
    return {
      kind: 'openrouter',
      apiKey: or,
      model: settings.openrouterModel.trim() || envOpenRouterModel(),
      label: 'OpenRouter',
    }
  }
  return { kind: 'local', label: '本地規則' }
}

export function hasLlmConfigured(settings = loadLlmSettings()): boolean {
  return resolveLlm(settings).kind !== 'local'
}

export function llmStatusText(settings = loadLlmSettings()): string {
  const gpt = Boolean(settings.openaiApiKey.trim())
  const or = Boolean(settings.openrouterApiKey.trim())
  const active = resolveLlm(settings)
  if (!gpt && !or) return '未設 API key，排課表會用本地規則。'
  if (gpt && or) {
    return `兩個都有 key。而家用 ${active.label}（可喺下面改優先）。`
  }
  if (gpt) return '得 ChatGPT key，排課表會用 ChatGPT。'
  return '得 OpenRouter key，排課表會用 OpenRouter。'
}
