import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, ChevronDown, Loader2, Sparkles } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import { WorkoutRunner } from '@/components/WorkoutRunner'
import { ExerciseRow } from '@/components/ExerciseRow'
import { ExerciseSheet } from '@/components/ExerciseSheet'
import { SessionReview } from '@/components/SessionReview'
import { SuggestForm } from '@/components/SuggestForm'
import { SwapSheet } from '@/components/SwapSheet'
import { getExercise } from '@/data/exercises'
import { sessionKcal, sessionMinutes, sessionVolumeKg } from '@/lib/stats'
import { formatMinutes } from '@/lib/utils'
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
    addSet,
    deleteSession,
  } = useWorkout()
  const [loading, setLoading] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [focus, setFocus] = useState<MuscleGroup[]>([])
  const [minutes, setMinutes] = useState(60)
  const [reason, setReason] = useState('')
  const [openPeId, setOpenPeId] = useState<string | null>(null)
  const [swapPeId, setSwapPeId] = useState<string | null>(null)

  const runSuggest = async (input?: SuggestInput) => {
    setLoading(true)
    try {
      const result = await generateSuggestion(input)
      await adoptSuggestion(result.session)
      setReason(result.reason)
      setCustomizing(false)
      setOpenPeId(null)
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
    return <WorkoutRunner session={todaySession} />
  }

  const showPlan = todaySession?.status === 'planned' && !customizing
  const showReview = completedTodayList.length > 0 && !showPlan && !customizing
  const showForm = !showPlan && (!showReview || customizing)
  const openPe = todaySession?.exercises.find((pe) => pe.id === openPeId)
  const openEx = openPe ? getExercise(openPe.exerciseId) : undefined

  return (
    <div className="page stack">
      <HomeHeader name={state.profile.name} />

      {loading && (
        <section className="panel empty">
          <Loader2 size={28} className="spin" />
          <h3 style={{ marginTop: 14 }}>排緊課表</h3>
          <p>按你揀嘅部位同時間嚟砌一套動作。</p>
        </section>
      )}

      {!loading && showForm && (
        <SuggestForm
          focus={focus}
          minutes={minutes}
          loading={loading}
          onToggleMuscle={toggleMuscle}
          onMinutes={setMinutes}
          onSuggest={() => void runSuggest({ focus, minutes })}
          onAuto={() => void runSuggest({ minutes })}
        />
      )}

      {!loading && showReview && (
        <TodayRecap
          sessions={completedTodayList}
          bodyWeightKg={state.profile.bodyWeightKg}
          onAnother={() => setCustomizing(true)}
          onDelete={deleteSession}
        />
      )}

      {!loading && showPlan && todaySession && (
        <UpNext
          session={todaySession}
          profileName={state.profile.name}
          reason={reason}
          onStart={() => startSession(todaySession.id)}
          onSwitch={() =>
            void runSuggest({
              focus: todaySession.focus.length ? todaySession.focus : undefined,
              minutes: todaySession.estimatedMinutes,
            })
          }
          onCustomize={() => {
            setFocus(todaySession.focus)
            setMinutes(todaySession.estimatedMinutes)
            setCustomizing(true)
          }}
          onOpen={setOpenPeId}
          onMore={setSwapPeId}
        />
      )}

      {showPlan && todaySession && openPe && openEx && (
        <ExerciseSheet
          exercise={openEx}
          planned={openPe}
          onClose={() => setOpenPeId(null)}
          onPatch={(setId, patch) => updateSet(todaySession.id, openPe.id, setId, patch)}
          onAddSet={() => addSet(todaySession.id, openPe.id)}
          onReplace={(id) => replaceExercise(todaySession.id, openPe.id, id)}
        />
      )}

      {showPlan && todaySession && swapPeId && (
        <div className="sheet-root">
          <button type="button" className="sheet-backdrop" onClick={() => setSwapPeId(null)} />
          <section className="sheet-card sheet-card-compact">
            <SwapSheet
              currentId={
                todaySession.exercises.find((pe) => pe.id === swapPeId)?.exerciseId ?? ''
              }
              onClose={() => setSwapPeId(null)}
              onPick={(id) => {
                replaceExercise(todaySession.id, swapPeId, id)
                setSwapPeId(null)
              }}
            />
          </section>
        </div>
      )}
    </div>
  )
}

function UpNext({
  session,
  profileName,
  reason,
  onStart,
  onSwitch,
  onCustomize,
  onOpen,
  onMore,
}: {
  session: NonNullable<ReturnType<typeof useWorkout>['todaySession']>
  profileName: string
  reason: string
  onStart: () => void
  onSwitch: () => void
  onCustomize: () => void
  onOpen: (id: string) => void
  onMore: (id: string) => void
}) {
  const muscles = useMemo(() => new Set(session.focus), [session.focus])

  return (
    <>
      <section className="up-next-head">
        <div className="row space-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1 className="display">下一步</h1>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              {session.exercises.length} 個動作 · {muscles.size || session.focus.length} 個肌群
            </p>
          </div>
          <button type="button" className="btn-switch" onClick={onSwitch}>
            <ArrowLeftRight size={14} />
            換一套
          </button>
        </div>
        <div className="plan-pills">
          <button type="button" className="plan-pill" onClick={onCustomize}>
            {minutesShort(session.estimatedMinutes)}
            <ChevronDown size={14} />
          </button>
          <Link to="/settings" className="plan-pill">
            {profileName.trim() || '個人'}
            <ChevronDown size={14} />
          </Link>
        </div>
        {reason && <p className="plan-reason">{reason}</p>}
      </section>

      <div className="ex-timeline">
        {session.exercises.map((pe) => {
          const ex = getExercise(pe.exerciseId)
          if (!ex) return null
          return (
            <ExerciseRow
              key={pe.id}
              exercise={ex}
              planned={pe}
              onOpen={() => onOpen(pe.id)}
              onMore={() => onMore(pe.id)}
            />
          )
        })}
      </div>

      <div className="sticky-cta sticky-cta-row">
        <button type="button" className="btn btn-primary btn-block display-btn" onClick={onStart}>
          開始訓練
        </button>
      </div>
    </>
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
      <section className="up-next-head">
        <h1 className="display">搞掂</h1>
        <p className="muted" style={{ margin: '6px 0 0' }}>
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
        <button type="button" className="btn btn-primary btn-block display-btn" onClick={onAnother}>
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

function HomeHeader({ name }: { name: string }) {
  return (
    <header className="home-top">
      <Link to="/settings" className="avatar" aria-label="設定">
        {initials(name)}
      </Link>
      <div>
        <p className="brand-mark">我的計劃</p>
        <p className="page-kicker">{format(new Date(), 'M月d日 EEEE', { locale: zhTW })}</p>
      </div>
    </header>
  )
}

function initials(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return 'GB'
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function minutesShort(mins: number) {
  if (mins === 90) return '1.5h'
  if (mins % 60 === 0) return `${mins / 60}h`
  return `${mins}m`
}
