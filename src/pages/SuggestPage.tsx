import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import { suggestWorkout } from '@/lib/ai-suggest'
import { getExercise, MUSCLE_LABELS } from '@/data/exercises'
import { formatMinutes, muscleLabel } from '@/lib/utils'

export function SuggestPage() {
  const { state, adoptSuggestion, startSession, todaySession } = useWorkout()
  const navigate = useNavigate()

  const result = useMemo(
    () => suggestWorkout(state.sessions, state.profile),
    [state.sessions, state.profile],
  )

  const handleAdopt = (start = false) => {
    const session = adoptSuggestion()
    if (start) {
      startSession(session.id)
      navigate('/session')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="page stack">
      <header>
        <p className="brand-mark">FORGE</p>
        <h1 style={{ marginTop: 8 }}>AI Workout Suggestion</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          根據你之前練過咩、恢復狀態同目標，自動排今日課表。
        </p>
      </header>

      <section className="panel panel-accent">
        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <Sparkles size={18} color="var(--accent)" />
          <span className="chip">核心推薦</span>
        </div>
        <h2>{result.session.title}</h2>
        <p style={{ margin: '8px 0 0' }}>{muscleLabel(result.session.focus)}</p>
        <p className="muted" style={{ margin: '10px 0 0', lineHeight: 1.5 }}>
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

      <button className="btn btn-primary btn-block" onClick={() => handleAdopt(true)}>
        採用並開始訓練
      </button>
      <button className="btn btn-ghost btn-block" onClick={() => handleAdopt(false)}>
        採用為今日計劃
      </button>
    </div>
  )
}
