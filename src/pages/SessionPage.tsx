import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Pause, Play, SkipForward } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import { suggestWorkout } from '@/lib/ai-suggest'
import { getExercise } from '@/data/exercises'
import { formatSeconds, sessionProgress } from '@/lib/utils'

type Phase = 'work' | 'rest'

export function SessionPage() {
  const {
    state,
    todaySession,
    adoptSuggestion,
    startSession,
    completeSet,
    finishSession,
  } = useWorkout()
  const navigate = useNavigate()

  const session = todaySession

  const flat = useMemo(() => {
    if (!session) return []
    return session.exercises.flatMap((ex, exIndex) =>
      ex.sets.map((set, setIndex) => ({
        ex,
        set,
        exIndex,
        setIndex,
        key: `${ex.id}-${set.id}`,
      })),
    )
  }, [session])

  const currentIndex = flat.findIndex((item) => !item.set.completed)
  const current = currentIndex >= 0 ? flat[currentIndex] : null
  const currentExercise = current ? getExercise(current.ex.exerciseId) : undefined

  const [phase, setPhase] = useState<Phase>('work')
  const [restLeft, setRestLeft] = useState(0)
  const [cardioLeft, setCardioLeft] = useState(0)
  const [cardioRunning, setCardioRunning] = useState(false)

  useEffect(() => {
    setPhase('work')
    setRestLeft(0)
    setCardioRunning(false)
    if (current?.ex.kind === 'cardio') {
      setCardioLeft(current.set.targetDurationSec ?? 300)
    }
  }, [current?.key])

  useEffect(() => {
    if (phase !== 'rest' || restLeft <= 0) return
    const t = window.setInterval(() => {
      setRestLeft((v) => {
        if (v <= 1) {
          setPhase('work')
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [phase, restLeft])

  useEffect(() => {
    if (!cardioRunning || cardioLeft <= 0) return
    const t = window.setInterval(() => {
      setCardioLeft((v) => {
        if (v <= 1) {
          setCardioRunning(false)
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [cardioRunning, cardioLeft])

  const ensureSession = () => {
    if (session) {
      if (session.status !== 'in_progress') startSession(session.id)
      return session
    }
    const created = adoptSuggestion()
    startSession(created.id)
    return created
  }

  const onCompleteSet = () => {
    const active = ensureSession()
    if (!current) return

    if (current.ex.kind === 'cardio') {
      const target = current.set.targetDurationSec ?? 300
      const done = cardioLeft <= 0 ? target : target - cardioLeft
      completeSet(active.id, current.ex.id, current.set.id, {
        actualDurationSec: Math.max(done, 1),
      })
    } else {
      completeSet(active.id, current.ex.id, current.set.id)
    }

    const nextIndex = currentIndex + 1
    const hasMore = nextIndex < flat.length
    if (!hasMore) {
      finishSession(active.id)
      navigate('/history')
      return
    }

    const rest = current.ex.restSec || (current.ex.kind === 'cardio' ? 60 : 90)
    setPhase('rest')
    setRestLeft(rest)
  }

  if (!session) {
    const preview = suggestWorkout(state.sessions, state.profile).session
    return (
      <div className="page stack">
        <header>
          <p className="brand-mark">FORGE</p>
          <h1 style={{ marginTop: 8 }}>Exercise Mode</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            未有進行中訓練。可以採用 AI 建議後即刻開始。
          </p>
        </header>
        <section className="panel">
          <h3>{preview.title}</h3>
          <p className="muted">{preview.goal}</p>
        </section>
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            const s = adoptSuggestion()
            startSession(s.id)
          }}
        >
          採用建議並開始
        </button>
        <Link to="/suggest" className="btn btn-ghost btn-block">
          先睇 AI 建議
        </Link>
      </div>
    )
  }

  const progress = sessionProgress(session)
  const restTotal = current?.ex.restSec || 90
  const restProgress =
    phase === 'rest' && restTotal > 0 ? ((restTotal - restLeft) / restTotal) * 100 : 0

  const cardioTotal = current?.set.targetDurationSec ?? 300
  const cardioProgress =
    cardioTotal > 0 ? ((cardioTotal - cardioLeft) / cardioTotal) * 100 : 0

  return (
    <div className="page stack">
      <header className="row space-between">
        <div>
          <p className="brand-mark">FORGE</p>
          <h2 style={{ marginTop: 6 }}>{session.title}</h2>
        </div>
        <span className="chip">{progress}%</span>
      </header>

      <div className="progress-bar">
        <span style={{ width: `${progress}%` }} />
      </div>

      {!current ? (
        <section className="panel empty">
          <h3>全部完成</h3>
          <p>做得好。進步已自動寫入訓練記錄。</p>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 14 }}
            onClick={() => {
              finishSession(session.id)
              navigate('/history')
            }}
          >
            查看記錄
          </button>
        </section>
      ) : (
        <>
          <section className="panel panel-accent">
            <p className="eyebrow">
              動作 {current.exIndex + 1}/{session.exercises.length} · Set{' '}
              {current.setIndex + 1}/{current.ex.sets.length}
            </p>
            <h1 style={{ fontSize: '2.4rem' }}>{currentExercise?.nameZh}</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              {currentExercise?.name}
            </p>

            {current.ex.kind === 'strength' ? (
              <div className="stat-grid" style={{ marginTop: 16 }}>
                <div className="stat">
                  <span className="muted">目標次數</span>
                  <strong>{current.set.targetReps ?? '-'}</strong>
                </div>
                <div className="stat">
                  <span className="muted">建議重量</span>
                  <strong>
                    {current.set.targetWeight != null ? `${current.set.targetWeight}` : '-'}
                    <span style={{ fontSize: '0.9rem' }}> kg</span>
                  </strong>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 18 }}>
                <div
                  className="timer-ring"
                  style={{ ['--progress' as string]: `${cardioProgress}%` }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <strong>{formatSeconds(cardioLeft)}</strong>
                    <p className="muted" style={{ margin: 0 }}>
                      5 mins running
                    </p>
                  </div>
                </div>
                <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setCardioRunning((v) => !v)}
                  >
                    {cardioRunning ? <Pause size={16} /> : <Play size={16} />}
                    {cardioRunning ? '暫停' : '開始計時'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {phase === 'rest' && (
            <section className="panel">
              <p className="eyebrow">Rest Timer</p>
              <div
                className="timer-ring"
                style={{ ['--progress' as string]: `${restProgress}%` }}
              >
                <div style={{ textAlign: 'center' }}>
                  <strong>{formatSeconds(restLeft)}</strong>
                  <p className="muted" style={{ margin: 0 }}>
                    休息中
                  </p>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setPhase('work')
                  setRestLeft(0)
                }}
              >
                <SkipForward size={16} /> 跳過休息
              </button>
            </section>
          )}

          <section className="panel">
            <h3 style={{ marginBottom: 8 }}>要點</h3>
            <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', lineHeight: 1.55 }}>
              {(currentExercise?.instructions ?? []).slice(0, 3).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {currentExercise && (
              <Link
                to={`/database/${currentExercise.id}`}
                className="muted"
                style={{ display: 'inline-block', marginTop: 12, fontSize: '0.9rem' }}
              >
                睇完整說明 / YouTube demo →
              </Link>
            )}
          </section>

          <section className="panel">
            <h3 style={{ marginBottom: 4 }}>本動作組數</h3>
            {current.ex.sets.map((set, i) => (
              <div key={set.id} className={`set-row${set.completed ? ' done' : ''}`}>
                <div className="badge">{i + 1}</div>
                <div>
                  {current.ex.kind === 'cardio'
                    ? `${Math.round((set.targetDurationSec ?? 300) / 60)} 分鐘`
                    : `${set.targetWeight ?? '-'} kg × ${set.targetReps ?? '-'} reps`}
                </div>
                {set.completed ? (
                  <Check size={18} color="var(--ok)" />
                ) : (
                  <span className="muted">待完成</span>
                )}
              </div>
            ))}
          </section>

          <button
            className="btn btn-primary btn-block"
            onClick={onCompleteSet}
            disabled={phase === 'rest'}
          >
            <Check size={18} />
            {current.ex.kind === 'cardio' ? '完成呢段有氧' : '完成呢組'}
          </button>

          <button
            className="btn btn-danger btn-block"
            onClick={() => {
              finishSession(session.id)
              navigate('/history')
            }}
          >
            結束並儲存進度
          </button>
        </>
      )}
    </div>
  )
}
