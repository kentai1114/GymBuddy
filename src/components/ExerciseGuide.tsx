import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Exercise } from '@/lib/types'
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/data/exercises'
import { ExerciseAnim } from '@/components/ExerciseAnim'

export function ExerciseGuide({
  exercise,
  compact = false,
  defaultOpen = false,
}: {
  exercise: Exercise
  compact?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen || !compact)

  const media = (
    <ExerciseAnim
      exerciseId={exercise.id}
      kind={exercise.kind}
      muscle={exercise.muscle}
      equipment={exercise.equipment}
      size={compact ? 'thumb' : 'wide'}
    />
  )

  const steps = (
    <ol className="howto-steps">
      {exercise.instructions.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  )

  if (!compact) {
    return (
      <section className="panel exercise-guide">
        <p className="eyebrow">點做呢個動作</p>
        {media}
        <p className="muted" style={{ margin: '10px 0 0', fontSize: '0.82rem' }}>
          {MUSCLE_LABELS[exercise.muscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
        </p>
        {steps}
      </section>
    )
  }

  return (
    <div className="exercise-guide compact">
      {media}
      <button
        type="button"
        className="howto-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>點樣做</span>
        <ChevronDown size={16} className={open ? 'chevron open' : 'chevron'} />
      </button>
      {open && steps}
    </div>
  )
}
