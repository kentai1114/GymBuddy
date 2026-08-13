import { resolveLlm } from './settings'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export class LlmError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'LlmError'
    this.status = status
  }
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

interface ChatPayload {
  error?: { message?: string; code?: string }
  choices?: Array<{
    message?: { content?: string | Array<{ type?: string; text?: string }> }
    finish_reason?: string
  }>
}

function messageText(data: ChatPayload | null): string {
  const content = data?.choices?.[0]?.message?.content
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim()
  }
  return ''
}

function headers(kind: 'openai' | 'openrouter', apiKey: string): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  if (kind === 'openrouter') {
    h['HTTP-Referer'] = typeof location !== 'undefined' ? location.origin : 'https://gymbuddy.app'
    h['X-Title'] = 'GymBuddy'
  }
  return h
}

async function postCompletion(
  kind: 'openai' | 'openrouter',
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ res: Response; data: ChatPayload | null }> {
  const res = await fetch(kind === 'openrouter' ? OPENROUTER_URL : OPENAI_URL, {
    method: 'POST',
    headers: headers(kind, apiKey),
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => null)) as ChatPayload | null
  return { res, data }
}

export async function chatCompletion(options: {
  messages: ChatMessage[]
  maxTokens?: number
  json?: boolean
}): Promise<string> {
  const llm = resolveLlm()
  if (llm.kind === 'local') {
    throw new LlmError('未設定 API Key。去設定 → LLM 貼上 ChatGPT 或 OpenRouter key。')
  }

  const maxTokens = Math.max(options.maxTokens ?? 1200, 256)
  const attempts: Array<Record<string, unknown>> = [
    {
      model: llm.model,
      messages: options.messages,
      max_completion_tokens: maxTokens,
      reasoning_effort: options.json ? 'low' : 'none',
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    },
    {
      model: llm.model,
      messages: options.messages,
      max_completion_tokens: maxTokens,
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    },
    {
      model: llm.model,
      messages: options.messages,
      max_completion_tokens: maxTokens,
    },
  ]

  let lastMsg = `${llm.label} 請求失敗`
  for (const body of attempts) {
    const { res, data } = await postCompletion(llm.kind, llm.apiKey, body)
    if (!res.ok) {
      lastMsg = data?.error?.message || `${llm.label} 錯誤 (${res.status})`
      if (res.status === 400) continue
      throw new LlmError(lastMsg, res.status)
    }
    const content = messageText(data)
    if (content) return content
    lastMsg = '模型冇返回內容'
  }

  throw new LlmError(lastMsg)
}

export function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced?.[1]?.trim() ?? text.trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end < 0) throw new Error('搵唔到 JSON')
  return JSON.parse(raw.slice(start, end + 1))
}
