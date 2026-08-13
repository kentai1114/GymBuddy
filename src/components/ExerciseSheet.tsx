import { useState, type ReactNode } from 'react'
import { Minus, Play, Plus, Repeat, X } from 'lucide-react'
import type { Exercise, PlannedExercise, PlannedSet } from '@/lib/types'
import { ExerciseAnim } from '@/components/ExerciseAnim'
import { SetsTable } from '@/components/SetsTable'
import { SwapSheet } from '@/components/SwapSheet'
import { formatSeconds } from '@/lib/utils'

const REST_STEP = 15
const REST_MIN = 15
const REST_MAX = 300

export function ExerciseHero({
  exercise,
  kicker,
  onClose,
  howToOpen,
  onToggleHowTo,
}: {
  exercise: Exercise
  kicker?: string
  onClose?: () => void
  howToOpen?: boolean
  onToggleHowTo?: () => void
}) {
  return (
    <div className="ex-hero">
      <ExerciseAnim
        exerciseId={exercise.id}
        kind={exercise.kind}
        muscle={exercise.muscle}
        equipment={exercise.equipment}
        size="hero"
      />
      <div className="ex-hero-scrim" />
      <div className="ex-hero-top">
        {kicker ? <span className="ex-hero-kicker">{kicker}</span> : <span />}
        {onClose && (
          <button type="button" className="icon-btn" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        )}
      </div>
      <div className="ex-hero-bottom">
        <h2 className="display">{exercise.nameZh}</h2>
        {onToggleHowTo && (
          <button
            type="button"
            className={`howto-pill${howToOpen ? ' on' : ''}`}
            onClick={onToggleHowTo}
          >
            <Play size={12} fill="currentColor" />
            教學
          </button>
        )}
      </div>
    </div>
  )
}

export function ExerciseActions({
  restSec,
  onRest,
  onReplace,
  extra,
}: {
  restSec?: number
  onRest?: (sec: number) => void
  onReplace?: () => void
  extra?: ReactNode
}) {
  return (
    <div className="ex-actions">
      {restSec != null &&
        (onRest ? (
          <div className="ex-action rest-adjust">
            <button
              type="button"
              className="rest-step"
              aria-label="減少休息"
              disabled={restSec <= REST_MIN}
              onClick={() => onRest(Math.max(REST_MIN, restSec - REST_STEP))}
            >
              <Minus size={14} />
            </button>
            <span>{formatSeconds(restSec)} 休息</span>
            <button
              type="button"
              className="rest-step"
              aria-label="增加休息"
              disabled={restSec >= REST_MAX}
              onClick={() => onRest(Math.min(REST_MAX, restSec + REST_STEP))}
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <span className="ex-action">{formatSeconds(restSec)} 休息</span>
        ))}
      {extra}
      {onReplace && (
        <button type="button" className="ex-action" onClick={onReplace}>
          <Repeat size={14} />
          換動作
        </button>
      )}
    </div>
  )
}

export function ExerciseSheet({
  exercise,
  planned,
  kicker = '下一步',
  highlightSetId,
  onClose,
  onPatch,
  onAddSet,
  onReplace,
  onRest,
}: {
  exercise: Exercise
  planned: PlannedExercise
  kicker?: string
  highlightSetId?: string
  onClose: () => void
  onPatch: (setId: string, patch: Partial<PlannedSet>) => void
  onAddSet?: () => void
  onReplace?: (exerciseId: string) => void
  onRest?: (sec: number) => void
}) {
  const [howTo, setHowTo] = useState(false)
  const [swapping, setSwapping] = useState(false)

  return (
    <div className="sheet-root">
      <button type="button" className="sheet-backdrop" onClick={onClose} aria-label="關閉" />
      <section className="sheet-card" role="dialog" aria-label={exercise.nameZh}>
        <ExerciseHero
          exercise={exercise}
          kicker={kicker}
          onClose={onClose}
          howToOpen={howTo}
          onToggleHowTo={() => setHowTo((v) => !v)}
        />
        {howTo && (
          <ol className="howto-steps sheet-howto">
            {exercise.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        <ExerciseActions
          restSec={planned.kind === 'strength' || planned.kind === 'timed' ? planned.restSec : undefined}
          onRest={onRest}
          onReplace={onReplace ? () => setSwapping((v) => !v) : undefined}
        />
        {swapping && onReplace && (
          <div className="sheet-swap">
            <SwapSheet
              currentId={exercise.id}
              onClose={() => setSwapping(false)}
              onPick={(id) => {
                onReplace(id)
                setSwapping(false)
              }}
            />
          </div>
        )}
        <div className="sheet-sets">
          <SetsTable pe={planned} highlightSetId={highlightSetId} onPatch={onPatch} onAddSet={onAddSet} />
        </div>
      </section>
    </div>
  )
}
