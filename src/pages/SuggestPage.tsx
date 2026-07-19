import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, RefreshCw, Sparkles, CheckCircle2, Settings } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import type { SuggestionResult } from '@/lib/ai-suggest'
import { suggestWorkoutHeuristic } from '@/lib/ai-suggest'
import { getExercise, MUSCLE_LABELS } from '@/data/exercises'
import { formatMinutes, muscleLabel } from '@/lib/utils'
import { hasLlmConfigured, loadLlmSettings } from '@/lib/settings'

export function SuggestPage() {
  const { state, adoptSuggestion, startSession, todaySession, generateSuggestion } = useWorkout()
  const navigate = useNavigate()
  const [result, setResult] = useState<SuggestionResult>(() =>
    suggestWorkoutHeuristic(state.sessions, state.profile),
  )
  const [loading, setLoading] = useState(false)
  const llmOn = hasLlmConfigured()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const next = await generateSuggestion()
      setResult(next)
    } finally {
      setLoading(false)
    }
  }, [generateSuggestion])

  useEffect(() => {
    void refresh()
    // initial LLM fetch only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAdopt = async (start = false) => {
    setLoading(true)
    try {
      const session = await adoptSuggestion(result.session)
      if (start) {
        startSession(session.id)
        navigate('/session')
      } else {
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
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
        <h1 style={{ marginTop: 8 }}>AI Workout Suggestion</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          {llmOn
            ? `OpenRouter · ${loadLlmSettings().model}`
            : '未設定 API Key — 而家用本地規則。去設定接真實 LLM。'}
        </p>
      </header>

      <section className="panel panel-accent">
        <div className="row space-between" style={{ marginBottom: 10 }}>
          <div className="row" style={{ gap: 8 }}>
            <Sparkles size={18} color="var(--accent)" />
            <span className="chip">{result.source === 'llm' ? 'OpenRouter LLM' : '本地引擎'}</span>
          </div>
          <button className="btn btn-ghost" style={{ minHeight: 36, padding: '0 12px' }} onClick={() => void refresh()} disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
            重新生成
          </button>
        </div>
        {loading && !result ? (
          <p className="muted">AI 諗緊今日課表…</p>
        ) : (
          <>
            <h2>{result.session.title}</h2>
            <p style={{ margin: '8px 0 0' }}>{muscleLabel(result.session.focus)}</p>
            <p className="muted" style={{ margin: '10px 0 0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {result.reason}
            </p>
            <div className="stat-grid" style={{ marginTop: 16 }}>
              <div className="stat">
                <span className="muted">預計時間</span>
                <strong>{formatMinutes(result.session.estimatedMinutes)}</strong>
              </div>
              <div className="stat">
                <span className="muted">動作數</span>
                <strong>{result.session.exercises.length}</strong>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <h3 style={{ marginBottom: 12 }}>建議課表</h3>
        {result.session.exercises.map((pe, i) => {
          const ex = getExercise(pe.exerciseId)
          return (
            <div className="list-item" key={pe.id}>
              <div className="badge">{i + 1}</div>
              <div style={{ flex: 1 }}>
                <strong>{ex?.nameZh}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                  {MUSCLE_LABELS[ex?.muscle ?? '']} ·{' '}
                  {pe.kind === 'cardio'
                    ? `計時 ${(pe.sets[0]?.targetDurationSec ?? 300) / 60} 分鐘`
                    : `${pe.sets.length}×${pe.sets[0]?.targetReps} · 休息 ${pe.restSec}s`}
                  {pe.sets[0]?.targetWeight != null ? ` · 建議 ${pe.sets[0].targetWeight} kg` : ''}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      <section className="panel">
        <h3 style={{ marginBottom: 10 }}>恢復狀態</h3>
        {result.recoveryNotes.map((note) => (
          <p key={note} className="muted" style={{ margin: '0 0 8px', fontSize: '0.9rem' }}>
            {note}
          </p>
        ))}
      </section>

      {todaySession && todaySession.source === 'ai' && todaySession.status !== 'completed' && (
        <div className="panel row" style={{ gap: 8 }}>
          <CheckCircle2 size={18} color="var(--ok)" />
          <span>你已有今日 AI 計劃：{todaySession.title}</span>
        </div>
      )}

      <button className="btn btn-primary btn-block" onClick={() => void handleAdopt(true)} disabled={loading}>
        採用並開始訓練
      </button>
      <button className="btn btn-ghost btn-block" onClick={() => void handleAdopt(false)} disabled={loading}>
        採用為今日計劃
      </button>
    </div>
  )
}
