import { useEffect, useMemo, useState } from 'react'
import { differenceInSeconds, parseISO } from 'date-fns'
import { Check, MoreHorizontal, SkipForward, X } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import { getExercise } from '@/data/exercises'
import { ExerciseHero, ExerciseActions } from '@/components/ExerciseSheet'
import { SetsTable } from '@/components/SetsTable'
import { HoldTimer } from '@/components/HoldTimer'
import { SwapSheet } from '@/components/SwapSheet'
import { formatSeconds, sessionProgress } from '@/lib/utils'
import type { PlannedSet, WorkoutSession } from '@/lib/types'

type Phase = 'work' | 'rest'

export function WorkoutRunner({ session }: { session: WorkoutSession }) {
  const { completeSet, finishSession, updateSet, replaceExercise, addSet } = useWorkout()
  const [swapOpen, setSwapOpen] = useState(false)
  const [howTo, setHowTo] = useState(false)
  const [menu, setMenu] = useState(false)

  const flat = useMemo(
    () =>
      session.exercises.flatMap((ex, exIndex) =>
        ex.sets.map((set, setIndex) => ({
          ex,
          set,
          exIndex,
          setIndex,
          key: `${ex.id}-${set.id}`,
        })),
      ),
    [session],
  )

  const currentIndex = flat.findIndex((item) => !item.set.completed)
  const current = currentIndex >= 0 ? flat[currentIndex] : null
  const currentExercise = current ? getExercise(current.ex.exerciseId) : undefined
  const usesTimer = current?.ex.kind === 'cardio' || current?.ex.kind === 'timed'

  const [phase, setPhase] = useState<Phase>('work')
  const [restLeft, setRestLeft] = useState(0)
  const [holdLeft, setHoldLeft] = useState(0)
  const [holdRunning, setHoldRunning] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const elapsed = session.startedAt
    ? Math.max(0, differenceInSeconds(new Date(now), parseISO(session.startedAt)))
    : 0

  useEffect(() => {
    setPhase('work')
    setRestLeft(0)
    setHoldRunning(false)
    setHowTo(false)
    setSwapOpen(false)
    if (current && (current.ex.kind === 'cardio' || current.ex.kind === 'timed')) {
      setHoldLeft(current.set.targetDurationSec ?? (current.ex.kind === 'cardio' ? 300 : 45))
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
    if (!holdRunning || holdLeft <= 0) return
    const t = window.setInterval(() => {
      setHoldLeft((v) => {
        if (v <= 1) {
          setHoldRunning(false)
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [holdRunning, holdLeft])

  const patchSet = (setId: string, patch: Partial<PlannedSet>) => {
    if (!current) return
    updateSet(session.id, current.ex.id, setId, patch)
  }

  const onCompleteSet = () => {
    if (!current) return

    if (usesTimer) {
      const target = current.set.targetDurationSec ?? 45
      const done = holdLeft <= 0 ? target : target - holdLeft
      completeSet(session.id, current.ex.id, current.set.id, {
        actualDurationSec: Math.max(done, 1),
        actualReps: current.set.targetReps,
        actualWeight: current.set.targetWeight,
      })
    } else {
      completeSet(session.id, current.ex.id, current.set.id, {
        actualReps: current.set.targetReps,
        actualWeight: current.set.targetWeight,
      })
    }

    const hasMore = currentIndex + 1 < flat.length
    if (!hasMore) {
      finishSession(session.id)
      return
    }

    setPhase('rest')
    setRestLeft(current.ex.restSec || 60)
  }

  const progress = sessionProgress(session)
  const holdTotal = current?.set.targetDurationSec ?? 45

  if (!current || !currentExercise) {
    return (
      <section className="panel empty">
        <h3>搞掂</h3>
        <p>今日訓練已記錄。</p>
      </section>
    )
  }

  return (
    <div className="lift-page">
      <ExerciseHero
        exercise={currentExercise}
        kicker={`${current.exIndex + 1}/${session.exercises.length} · ${formatSeconds(elapsed)}`}
        howToOpen={howTo}
        onToggleHowTo={() => setHowTo((v) => !v)}
      />
      <div className="lift-tools">
        <div className="progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <button type="button" className="icon-btn" onClick={() => setMenu((v) => !v)} aria-label="更多">
          {menu ? <X size={18} /> : <MoreHorizontal size={18} />}
        </button>
      </div>
      {menu && (
        <div className="lift-menu">
          <button type="button" className="btn btn-danger btn-block" onClick={() => finishSession(session.id)}>
            結束訓練
          </button>
        </div>
      )}
      {howTo && (
        <ol className="howto-steps sheet-howto">
          {currentExercise.instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      <ExerciseActions
        restSec={current.ex.kind === 'cardio' ? undefined : current.ex.restSec}
        onReplace={() => setSwapOpen((v) => !v)}
      />
      {swapOpen && (
        <SwapSheet
          currentId={current.ex.exerciseId}
          onClose={() => setSwapOpen(false)}
          onPick={(id) => {
            replaceExercise(session.id, current.ex.id, id)
            setSwapOpen(false)
          }}
        />
      )}
      <div className="sheet-sets">
        <SetsTable
          pe={current.ex}
          highlightSetId={current.set.id}
          onPatch={(setId, patch) => patchSet(setId, patch)}
          onAddSet={() => addSet(session.id, current.ex.id)}
          onCurrentDuration={usesTimer ? setHoldLeft : undefined}
        />
        {usesTimer && (
          <HoldTimer
            left={holdLeft}
            total={holdTotal}
            running={holdRunning}
            onToggle={() => {
              if (holdLeft <= 0) setHoldLeft(holdTotal)
              setHoldRunning((v) => !v)
            }}
          />
        )}
      </div>

      {phase === 'rest' && (
        <section className="rest-overlay">
          <p className="eyebrow">休息</p>
          <strong>{formatSeconds(restLeft)}</strong>
          <p className="muted">下一組</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setPhase('work')
              setRestLeft(0)
            }}
          >
            <SkipForward size={16} /> 跳過休息
          </button>
        </section>
      )}

      <div className="sticky-cta lift-cta">
        <button
          type="button"
          className="btn btn-primary btn-block display-btn"
          onClick={onCompleteSet}
          disabled={phase === 'rest'}
        >
          <Check size={18} />
          {usesTimer ? '完成呢段' : '完成呢組'}
        </button>
      </div>
    </div>
  )
}
