import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Clock3, Settings, Target, Timer } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import { suggestWorkoutHeuristic } from '@/lib/ai-suggest'
import {
  formatMinutes,
  formatRelative,
  lastCompleted,
  muscleLabel,
  sessionProgress,
} from '@/lib/utils'
import { getExercise } from '@/data/exercises'
import { hasLlmConfigured } from '@/lib/settings'

export function HomePage() {
  const { state, todaySession, adoptSuggestion, startSession } = useWorkout()
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const last = lastCompleted(state.sessions)
  const preview = todaySession ?? suggestWorkoutHeuristic(state.sessions, state.profile).session
  const isPlanned = Boolean(todaySession)

  const handleStart = async () => {
    setStarting(true)
    try {
      let session = todaySession
      if (!session) {
        session = await adoptSuggestion()
      }
      startSession(session.id)
      navigate('/session')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="page stack">
      <header className="row space-between">
        <div>
          <p className="brand-mark">FORGE</p>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>
            你好，{state.profile.name}
            {hasLlmConfigured() ? ' · LLM 已接' : ''}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/settings" className="chip" aria-label="設定">
            <Settings size={14} />
          </Link>
          <Link to="/weekly" className="chip">
            本週概覽
          </Link>
        </div>
      </header>

      <section className="panel panel-accent hero-today">
        <p className="eyebrow">今日訓練</p>
        <h1>{preview.title}</h1>
        <p className="muted" style={{ margin: 0, maxWidth: '28ch' }}>
          {muscleLabel(preview.focus)} · {preview.goal}
        </p>
        {!isPlanned && (
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            尚未採用計劃 — AI 已根據你嘅訓練史預先排好。
          </p>
        )}
      </section>

      <section className="stat-grid">
        <div className="stat">
          <span className="muted row" style={{ gap: 6 }}>
            <Timer size={14} /> 預計時間
          </span>
          <strong>{formatMinutes(preview.estimatedMinutes)}</strong>
        </div>
        <div className="stat">
          <span className="muted row" style={{ gap: 6 }}>
            <Clock3 size={14} /> 上次訓練
          </span>
          <strong style={{ fontSize: '1.05rem' }}>
            {last ? formatRelative(last.completedAt) : '尚未訓練'}
          </strong>
        </div>
        <div className="stat" style={{ gridColumn: '1 / -1' }}>
          <span className="muted row" style={{ gap: 6 }}>
            <Target size={14} /> 今日目標
          </span>
          <strong style={{ fontSize: '1.15rem', textTransform: 'none', fontFamily: 'var(--font-body)' }}>
            {preview.goal}
          </strong>
        </div>
      </section>

      {todaySession?.status === 'in_progress' && (
        <section className="panel">
          <div className="row space-between" style={{ marginBottom: 10 }}>
            <h3>進行中</h3>
            <span className="chip">{sessionProgress(todaySession)}%</span>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${sessionProgress(todaySession)}%` }} />
          </div>
        </section>
      )}

      <section className="panel">
        <div className="row space-between" style={{ marginBottom: 8 }}>
          <h3>動作預覽</h3>
          <Link to="/suggest" className="muted" style={{ fontSize: '0.85rem' }}>
            睇 AI 建議
          </Link>
        </div>
        {preview.exercises.slice(0, 4).map((pe, i) => {
          const ex = getExercise(pe.exerciseId)
          return (
            <div className="list-item" key={pe.id}>
              <div className="badge">{i + 1}</div>
              <div style={{ flex: 1 }}>
                <strong>{ex?.nameZh ?? pe.exerciseId}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                  {pe.kind === 'cardio'
                    ? `${Math.round((pe.sets[0]?.targetDurationSec ?? 300) / 60)} 分鐘有氧`
                    : `${pe.sets.length} 組 × ${pe.sets[0]?.targetReps ?? '-'} 次`}
                  {pe.sets[0]?.targetWeight ? ` · ${pe.sets[0].targetWeight} kg` : ''}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      <div className="stack">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => void handleStart()}
          disabled={starting}
        >
          {starting
            ? '準備中…'
            : todaySession?.status === 'in_progress'
              ? '繼續訓練'
              : '開始今日訓練'}
          <ArrowRight size={18} />
        </button>
        <div className="row" style={{ gap: 10 }}>
          <Link to="/coach" className="btn btn-ghost btn-block">
            AI Coach
          </Link>
          <Link to="/history" className="btn btn-ghost btn-block">
            訓練記錄
          </Link>
        </div>
      </div>
    </div>
  )
}
