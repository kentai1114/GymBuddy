import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Settings, Sparkles } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import { WorkoutRunner } from '@/components/WorkoutRunner'
import { ExerciseCard, prescriptionText } from '@/components/ExerciseCard'
import { SessionReview } from '@/components/SessionReview'
import { SuggestForm } from '@/components/SuggestForm'
import { RecoveryStrip } from '@/components/RecoveryStrip'
import { SwapSheet } from '@/components/SwapSheet'
import { APP_MARK } from '@/lib/brand'
import { getExercise } from '@/data/exercises'
import { sessionKcal, sessionMinutes, sessionVolumeKg } from '@/lib/stats'
import { formatMinutes, muscleLabel } from '@/lib/utils'
import type { MuscleGroup, SuggestInput } from '@/lib/types'

export function HomePage() {
  const {
    state,
    todaySession,
    completedTodayList,
    adoptSuggestion,
    generateSuggestion,
    startSession,
    replaceExercise,
    updateSet,
    deleteSession,
  } = useWorkout()
  const [loading, setLoading] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [focus, setFocus] = useState<MuscleGroup[]>([])
  const [minutes, setMinutes] = useState(60)
  const [reason, setReason] = useState('')
  const [swapPeId, setSwapPeId] = useState<string | null>(null)

  const runSuggest = async (input?: SuggestInput) => {
    setLoading(true)
    try {
      const result = await generateSuggestion(input)
      await adoptSuggestion(result.session)
      setReason(result.reason)
      setCustomizing(false)
    } finally {
      setLoading(false)
    }
  }

  const toggleMuscle = (muscle: MuscleGroup) => {
    setFocus((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle],
    )
  }

  if (todaySession?.status === 'in_progress') {
    return (
      <div className="page stack">
        <Header kicker="訓練中" />
        <WorkoutRunner session={todaySession} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page stack">
        <Header />
        <section className="panel empty">
          <Loader2 size={28} className="spin" />
          <h3 style={{ marginTop: 14 }}>排緊課表</h3>
          <p>按你揀嘅部位同時間嚟砌一套動作。</p>
        </section>
      </div>
    )
  }

  const showPlan = todaySession?.status === 'planned' && !customizing
  const showReview = completedTodayList.length > 0 && !showPlan && !customizing
  const showForm = !showPlan && (!showReview || customizing)

  return (
    <div className="page stack">
      <Header />

      {showForm && (
        <>
          <RecoveryStrip sessions={state.sessions} />
          <SuggestForm
            focus={focus}
            minutes={minutes}
            loading={loading}
            onToggleMuscle={toggleMuscle}
            onMinutes={setMinutes}
            onSuggest={() => void runSuggest({ focus, minutes })}
            onAuto={() => void runSuggest({ minutes })}
          />
        </>
      )}

      {showReview && (
        <TodayRecap
          sessions={completedTodayList}
          bodyWeightKg={state.profile.bodyWeightKg}
          onAnother={() => setCustomizing(true)}
          onDelete={deleteSession}
        />
      )}

      {showPlan && todaySession && (
        <>
          <section className="panel hero-today">
            <p className="eyebrow">今日訓練</p>
            <h1>{todaySession.title}</h1>
            <p className="muted" style={{ margin: 0 }}>
              {muscleLabel(todaySession.focus)} · {formatMinutes(todaySession.estimatedMinutes)} ·{' '}
              {todaySession.exercises.length} 個動作
            </p>
            {reason && (
              <p className="muted" style={{ margin: '4px 0 0', lineHeight: 1.45, fontSize: '0.88rem' }}>
                {reason}
              </p>
            )}
          </section>

          <div className="ex-list">
            {todaySession.exercises.map((pe) => {
              const ex = getExercise(pe.exerciseId)
              if (!ex) return null
              const swapping = swapPeId === pe.id
              return (
                <div key={pe.id} className="ex-slot" id={swapping ? `swap-${pe.id}` : undefined}>
                  <ExerciseCard
                    exercise={ex}
                    subtitle={prescriptionText(pe)}
                    planned={pe}
                    swapping={swapping}
                    onSwap={() => setSwapPeId(swapping ? null : pe.id)}
                    onUpdateSet={(setId, patch) => updateSet(todaySession.id, pe.id, setId, patch)}
                  />
                  {swapping && (
                    <SwapSheet
                      currentId={pe.exerciseId}
                      onClose={() => setSwapPeId(null)}
                      onPick={(id) => {
                        replaceExercise(todaySession.id, pe.id, id)
                        setSwapPeId(null)
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="sticky-cta">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => startSession(todaySession.id)}
            >
              開始訓練
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setCustomizing(true)}>
              改部位／時間
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function TodayRecap({
  sessions,
  bodyWeightKg,
  onAnother,
  onDelete,
}: {
  sessions: ReturnType<typeof useWorkout>['completedTodayList']
  bodyWeightKg: number
  onAnother: () => void
  onDelete: (sessionId: string) => void
}) {
  const minutes = sessions.reduce((sum, s) => sum + sessionMinutes(s), 0)
  const kcal = sessions.reduce((sum, s) => sum + sessionKcal(s, bodyWeightKg), 0)
  const volume = Math.round(sessions.reduce((sum, s) => sum + sessionVolumeKg(s), 0))

  return (
    <>
      <section className="panel hero-today">
        <p className="eyebrow">搞掂</p>
        <h1>今日訓練</h1>
        <p className="muted" style={{ margin: 0 }}>
          {sessions.length > 1 ? `完成 ${sessions.length} 堂` : sessions[0]?.title}
        </p>
      </section>
      <section className="stat-grid">
        <div className="stat">
          <span className="muted">時間</span>
          <strong>{formatMinutes(minutes)}</strong>
        </div>
        <div className="stat">
          <span className="muted">消耗</span>
          <strong>{kcal} kcal</strong>
        </div>
        <div className="stat" style={{ gridColumn: '1 / -1' }}>
          <span className="muted">訓練量</span>
          <strong>{volume.toLocaleString()} kg</strong>
        </div>
      </section>
      {sessions.map((session) => (
        <SessionReview
          key={session.id}
          session={session}
          bodyWeightKg={bodyWeightKg}
          onDelete={() => onDelete(session.id)}
        />
      ))}
      <div className="sticky-cta">
        <button type="button" className="btn btn-primary btn-block" onClick={onAnother}>
          <Sparkles size={16} />
          再排一堂
        </button>
        <Link to="/history" className="btn btn-ghost btn-block">
          睇記錄
        </Link>
      </div>
    </>
  )
}

function Header({ kicker }: { kicker?: string }) {
  return (
    <header className="row space-between">
      <div>
        <p className="brand-mark">{APP_MARK}</p>
        <p className="page-kicker">
          {kicker ?? format(new Date(), 'M月d日 EEEE', { locale: zhTW })}
        </p>
      </div>
      <Link to="/settings" className="chip" aria-label="設定">
        <Settings size={16} />
      </Link>
    </header>
  )
}
