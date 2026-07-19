import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'

const QUICK = ['今日練咩？', '我夠唔夠休息？', '點樣加重量？', '有氧點安排？']

export function CoachPage() {
  const { state, sendChat } = useWorkout()
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.chat.length])

  const submit = () => {
    const value = text.trim()
    if (!value) return
    sendChat(value)
    setText('')
  }

  return (
    <div className="page stack">
      <header>
        <p className="brand-mark">FORGE</p>
        <h1 style={{ marginTop: 8 }}>AI Coach</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          問訓練安排、恢復、加重同動作要點。
        </p>
      </header>

      <section className="panel">
        <div className="chat">
          {state.chat.map((msg) => (
            <div key={msg.id} className={`bubble ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </section>

      <div className="filters">
        {QUICK.map((q) => (
          <button key={q} className="filter-chip" onClick={() => sendChat(q)}>
            {q}
          </button>
        ))}
      </div>

      <div className="row">
        <input
          className="input"
          placeholder="例如：腿仲好酸，今日做咩好？"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button className="btn btn-primary" onClick={submit} aria-label="送出">
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
