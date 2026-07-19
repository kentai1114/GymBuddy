import { loadLlmSettings } from './settings'

const BASE = 'https://openrouter.ai/api/v1'

export class OpenRouterError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'OpenRouterError'
    this.status = status
  }
}

export async function chatCompletion(options: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature?: number
  maxTokens?: number
  json?: boolean
}): Promise<string> {
  const settings = loadLlmSettings()
  if (!settings.apiKey.trim()) {
    throw new OpenRouterError('未設定 OpenRouter API Key。去設定頁貼上 key。')
  }

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://forge-gym.app',
      'X-Title': 'FORGE Gym Assistant',
    },
    body: JSON.stringify({
      model: settings.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.maxTokens ?? 1200,
      ...(options.json
        ? {
            response_format: { type: 'json_object' },
          }
        : {}),
    }),
  })

  const data = (await res.json().catch(() => null)) as {
    error?: { message?: string }
    choices?: Array<{ message?: { content?: string } }>
  } | null

  if (!res.ok) {
    const msg = data?.error?.message || `OpenRouter 錯誤 (${res.status})`
    throw new OpenRouterError(msg, res.status)
  }

  const content = data?.choices?.[0]?.message?.content?.trim()
  if (!content) throw new OpenRouterError('模型冇返回內容')
  return content
}

export function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced?.[1]?.trim() ?? text.trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end < 0) throw new Error('搵唔到 JSON')
  return JSON.parse(raw.slice(start, end + 1))
}
