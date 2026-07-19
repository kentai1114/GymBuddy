import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Send, Settings } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import { hasLlmConfigured, loadLlmSettings } from '@/lib/settings'

const QUICK = ['今日練咩？', '我夠唔夠休息？', '點樣加重量？', '有氧點安排？']

export function CoachPage() {
  const { state, sendChat, chatLoading } = useWorkout()
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const llmOn = hasLlmConfigured()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.chat.length, chatLoading])

  const submit = async (value = text) => {
    const next = value.trim()
    if (!next || chatLoading) return
    setText('')
    await sendChat(next)
  }

  return (
    <div className="page stack">
      <header>
        <div className="row space-between">
          <p className="brand-mark">FORGE</p>
          <Link to="/settings" className="chip">
            <Settings size={14} /> LLM
          </Link>
        </div>
        <h1 style={{ marginTop: 8 }}>AI Coach</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          {llmOn
            ? `OpenRouter · ${loadLlmSettings().model}`
            : '未設定 API Key — 用本地回覆。去設定接真實 LLM。'}
        </p>
      </header>

      <section className="panel">
        <div className="chat">
          {state.chat.map((msg) => (
            <div key={msg.id} className={`bubble ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {chatLoading && (
            <div className="bubble coach muted">
              <Loader2 size={16} className="spin" style={{ verticalAlign: 'middle' }} /> Coach 諗緊…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </section>

      <div className="filters">
        {QUICK.map((q) => (
          <button
            key={q}
            className="filter-chip"
            disabled={chatLoading}
            onClick={() => void submit(q)}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="row">
        <input
          className="input"
          placeholder="例如：腿仲好酸，今日做咩好？"
          value={text}
          disabled={chatLoading}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit()
          }}
        />
        <button
          className="btn btn-primary"
          onClick={() => void submit()}
          disabled={chatLoading}
          aria-label="送出"
        >
          {chatLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  )
}
