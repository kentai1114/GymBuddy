import { MoreHorizontal } from 'lucide-react'
import type { Exercise, PlannedExercise } from '@/lib/types'
import { ExerciseAnim } from '@/components/ExerciseAnim'
import { MuscleMap } from '@/components/MuscleMap'
import { prescriptionText } from '@/lib/utils'

export function ExerciseRow({
  exercise,
  planned,
  done,
  onOpen,
  onMore,
}: {
  exercise: Exercise
  planned: PlannedExercise
  done?: boolean
  onOpen: () => void
  onMore?: () => void
}) {
  return (
    <div className={`ex-row${done ? ' done' : ''}`}>
      <button type="button" className="ex-row-main" onClick={onOpen}>
        <span className="ex-row-thumb">
          <ExerciseAnim
            exerciseId={exercise.id}
            kind={exercise.kind}
            muscle={exercise.muscle}
            equipment={exercise.equipment}
          />
          <span className="ex-row-map">
            <MuscleMap muscle={exercise.muscle} />
          </span>
        </span>
        <span className="ex-row-copy">
          <strong>{exercise.nameZh}</strong>
          <span className="muted">{prescriptionText(planned)}</span>
        </span>
      </button>
      {onMore && (
        <button type="button" className="ex-row-more" onClick={onMore} aria-label="換動作">
          <MoreHorizontal size={18} />
        </button>
      )}
    </div>
  )
}
