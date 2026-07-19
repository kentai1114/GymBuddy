export type LlmModelOption = {
  id: string
  label: string
  tier: 'free' | 'cheap' | 'auto'
  note: string
}

/** OpenRouter free / cheap presets — roster rotates; check openrouter.ai/models */
export const LLM_MODELS: LlmModelOption[] = [
  {
    id: 'openrouter/free',
    label: 'Free Router（自動）',
    tier: 'auto',
    note: '自動揀可用免費 model，$0',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    label: 'Llama 3.3 70B Free',
    tier: 'free',
    note: '免費、推理穩陣，適合課表建議',
  },
  {
    id: 'google/gemma-3-12b-it:free',
    label: 'Gemma 3 12B Free',
    tier: 'free',
    note: '免費、回應快',
  },
  {
    id: 'qwen/qwen3-4b:free',
    label: 'Qwen3 4B Free',
    tier: 'free',
    note: '免費、輕量快速',
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    label: 'DeepSeek V3 Free',
    tier: 'free',
    note: '免費（有額度時），中文表現好',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    label: 'Gemini 2.0 Flash',
    tier: 'cheap',
    note: '極平付費，穩定高配額',
  },
  {
    id: 'deepseek/deepseek-chat',
    label: 'DeepSeek Chat',
    tier: 'cheap',
    note: '好平、中文強',
  },
]

const KEY = 'forge-llm-settings-v1'

export interface LlmSettings {
  apiKey: string
  model: string
  enabled: boolean
}

const DEFAULTS: LlmSettings = {
  apiKey: '',
  model: 'openrouter/free',
  enabled: true,
}

export function loadLlmSettings(): LlmSettings {
  try {
    const envKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return { ...DEFAULTS, apiKey: envKey ?? '' }
    }
    const parsed = JSON.parse(raw) as Partial<LlmSettings>
    return {
      ...DEFAULTS,
      ...parsed,
      apiKey: parsed.apiKey || envKey || '',
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveLlmSettings(settings: LlmSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

export function hasLlmConfigured(settings = loadLlmSettings()): boolean {
  return Boolean(settings.enabled && settings.apiKey.trim())
}
