import { useEffect, useMemo, useState } from 'react'
import { differenceInSeconds, parseISO } from 'date-fns'
import { Check, SkipForward } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import { getExercise } from '@/data/exercises'
import { ExerciseCard, prescriptionText } from '@/components/ExerciseCard'
import { SwapSheet } from '@/components/SwapSheet'
import { SetsTable } from '@/components/SetsTable'
import { HoldTimer } from '@/components/HoldTimer'
import { formatSeconds, sessionProgress } from '@/lib/utils'
import type { PlannedSet, WorkoutSession } from '@/lib/types'

type Phase = 'work' | 'rest'

export function WorkoutRunner({ session }: { session: WorkoutSession }) {
  const { completeSet, finishSession, updateSet, replaceExercise } = useWorkout()
  const [swapPeId, setSwapPeId] = useState<string | null>(null)

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
  const restTotal = current?.ex.restSec || 75
  const restProgress =
    phase === 'rest' && restTotal > 0 ? ((restTotal - restLeft) / restTotal) * 100 : 0
  const holdTotal = current?.set.targetDurationSec ?? 45

  if (!current) {
    return (
      <section className="panel empty">
        <h3>搞掂</h3>
        <p>今日訓練已記錄。</p>
      </section>
    )
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="row space-between">
          <div>
            <p className="eyebrow">進行緊</p>
            <p className="workout-clock">{formatSeconds(elapsed)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
              {current.exIndex + 1}/{session.exercises.length} 動作
            </p>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>
              {progress}%
            </p>
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      {currentExercise && (
        <div className="ex-slot">
          <ExerciseCard
            exercise={currentExercise}
            subtitle={prescriptionText(current.ex)}
            active
            defaultOpen
            hideSets
            swapping={swapPeId === current.ex.id}
            onSwap={() => setSwapPeId(swapPeId === current.ex.id ? null : current.ex.id)}
          />
          {swapPeId === current.ex.id && (
            <SwapSheet
              currentId={current.ex.exerciseId}
              onClose={() => setSwapPeId(null)}
              onPick={(id) => {
                replaceExercise(session.id, current.ex.id, id)
                setSwapPeId(null)
              }}
            />
          )}
        </div>
      )}

      <section className={`panel${usesTimer ? ' work-split' : ''}`}>
        {current.ex.kind === 'strength' && (
          <SetsTable
            pe={current.ex}
            highlightSetId={current.set.id}
            onPatch={(setId, patch) => patchSet(setId, patch)}
          />
        )}

        {usesTimer && (
          <>
            <SetsTable
              pe={current.ex}
              highlightSetId={current.set.id}
              onPatch={(setId, patch) => patchSet(setId, patch)}
              onCurrentDuration={setHoldLeft}
            />
            <HoldTimer
              left={holdLeft}
              total={holdTotal}
              running={holdRunning}
              onToggle={() => {
                if (holdLeft <= 0) setHoldLeft(holdTotal)
                setHoldRunning((v) => !v)
              }}
            />
          </>
        )}
      </section>

      {phase === 'rest' && (
        <section className="panel panel-accent">
          <p className="eyebrow">休息</p>
          <div className="timer-ring" style={{ ['--progress' as string]: `${restProgress}%` }}>
            <div style={{ textAlign: 'center' }}>
              <strong>{formatSeconds(restLeft)}</strong>
              <p className="muted" style={{ margin: 0 }}>
                下一組
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

      <div className="sticky-cta">
        <button
          className="btn btn-primary btn-block"
          onClick={onCompleteSet}
          disabled={phase === 'rest'}
        >
          <Check size={18} />
          {usesTimer ? '完成呢段' : '完成呢組'}
        </button>
        <button className="btn btn-danger btn-block" onClick={() => finishSession(session.id)}>
          結束訓練
        </button>
      </div>

      {session.exercises.length > 1 && (
        <div className="ex-list">
          {session.exercises.map((pe, i) => {
            const ex = getExercise(pe.exerciseId)
            if (!ex || pe.id === current.ex.id) return null
            const done = pe.sets.every((s) => s.completed)
            const swapping = swapPeId === pe.id
            return (
              <div key={pe.id} className="ex-slot">
                <ExerciseCard
                  exercise={ex}
                  subtitle={`${i + 1}. ${prescriptionText(pe)}`}
                  done={done}
                  planned={pe}
                  swapping={swapping}
                  onSwap={done ? undefined : () => setSwapPeId(swapping ? null : pe.id)}
                  onUpdateSet={
                    done
                      ? undefined
                      : (setId, patch) => updateSet(session.id, pe.id, setId, patch)
                  }
                />
                {swapping && (
                  <SwapSheet
                    currentId={pe.exerciseId}
                    onClose={() => setSwapPeId(null)}
                    onPick={(id) => {
                      replaceExercise(session.id, pe.id, id)
                      setSwapPeId(null)
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
