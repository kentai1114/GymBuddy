import { useState, type MouseEvent } from 'react'
import { ChevronDown, Repeat } from 'lucide-react'
import type { Exercise, PlannedExercise, PlannedSet } from '@/lib/types'
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/data/exercises'
import { SetsTable } from '@/components/SetsTable'
import { ExerciseAnim } from '@/components/ExerciseAnim'
import { SideTimer } from '@/components/HoldTimer'

export function prescriptionText(pe: PlannedExercise): string {
  if (pe.kind === 'cardio') {
    return `${Math.round((pe.sets[0]?.targetDurationSec ?? 300) / 60)} 分鐘`
  }
  if (pe.kind === 'timed') {
    const load = pe.sets[0]?.targetWeight
    return `${pe.sets.length} 組 × ${pe.sets[0]?.targetDurationSec ?? 45} 秒${
      load != null ? ` · ${load} kg` : ''
    }`
  }
  const weight = pe.sets[0]?.targetWeight
  return `${pe.sets.length} 組 × ${pe.sets[0]?.targetReps ?? '-'} 次${
    weight != null ? ` · ${weight} kg` : ''
  }`
}

function timerSeconds(pe: PlannedExercise): number {
  const current = pe.sets.find((s) => !s.completed) ?? pe.sets[0]
  if (pe.kind === 'cardio') return current?.targetDurationSec ?? 300
  return current?.targetDurationSec ?? 45
}

export function ExerciseCard({
  exercise,
  subtitle,
  active = false,
  done = false,
  defaultOpen = false,
  planned,
  hideSets = false,
  swapping = false,
  onSwap,
  onUpdateSet,
}: {
  exercise: Exercise
  subtitle: string
  active?: boolean
  done?: boolean
  defaultOpen?: boolean
  planned?: PlannedExercise
  hideSets?: boolean
  swapping?: boolean
  onSwap?: () => void
  onUpdateSet?: (setId: string, patch: Partial<PlannedSet>) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const timed = planned?.kind === 'timed' || planned?.kind === 'cardio'
  const showSets = !hideSets && planned && onUpdateSet && !done

  const toggle = (e?: MouseEvent) => {
    e?.stopPropagation()
    setOpen((v) => !v)
  }

  return (
    <article className={`ex-card${active ? ' active' : ''}${done ? ' done' : ''}${swapping ? ' swapping' : ''}`}>
      <div className={`ex-card-main${onSwap ? ' with-swap' : ''}`}>
        <button type="button" className="ex-thumb" onClick={toggle} aria-label={`${exercise.nameZh} 示範`}>
          <ExerciseAnim
            exerciseId={exercise.id}
            kind={exercise.kind}
            muscle={exercise.muscle}
            equipment={exercise.equipment}
          />
        </button>
        <button type="button" className="ex-card-copy" onClick={() => setOpen((v) => !v)}>
          <strong>{exercise.nameZh}</strong>
          <span className="muted">{subtitle}</span>
          <span className="ex-tags">
            <i>{MUSCLE_LABELS[exercise.muscle]}</i>
            <i>{EQUIPMENT_LABELS[exercise.equipment]}</i>
          </span>
        </button>
        {onSwap && (
          <button type="button" className="ex-chevron" onClick={onSwap} aria-label="換動作">
            <Repeat size={16} />
          </button>
        )}
        <button
          type="button"
          className="ex-chevron"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="教學"
        >
          <ChevronDown size={18} className={open ? 'chevron open' : 'chevron'} />
        </button>
      </div>
      {open && (
        <div className="ex-card-detail">
          <ExerciseAnim
            exerciseId={exercise.id}
            kind={exercise.kind}
            muscle={exercise.muscle}
            equipment={exercise.equipment}
            size="wide"
          />
          <ol className="howto-steps">
            {exercise.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      {showSets && planned && onUpdateSet && (
        <div className={`ex-card-sets${timed ? ' work-split' : ''}`}>
          <SetsTable pe={planned} onPatch={onUpdateSet} />
          {timed && <SideTimer durationSec={timerSeconds(planned)} />}
        </div>
      )}
    </article>
  )
}
