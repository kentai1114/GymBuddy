import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { getExercise } from '@/data/exercises'
import { MuscleMap } from '@/components/MuscleMap'
import { sessionKcal, sessionMinutes, sessionVolumeKg } from '@/lib/stats'
import { formatMinutes, muscleLabel } from '@/lib/utils'
import type { WorkoutSession } from '@/lib/types'

export function SessionReview({
  session,
  bodyWeightKg,
  nested = false,
  onDelete,
}: {
  session: WorkoutSession
  bodyWeightKg: number
  nested?: boolean
  onDelete?: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const minutes = sessionMinutes(session)
  const kcal = sessionKcal(session, bodyWeightKg)
  const volume = Math.round(sessionVolumeKg(session))
  const doneMoves = session.exercises.filter((pe) => pe.sets.some((s) => s.completed))
  const names = doneMoves
    .map((pe) => getExercise(pe.exerciseId)?.nameZh)
    .filter(Boolean)
    .join(' · ')

  return (
    <section className={nested ? 'log-card nested' : 'log-card'}>
      <div className="log-card-head">
        <span className="log-card-map">
          <MuscleMap muscle={session.focus[0] ?? 'full_body'} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{muscleLabel(session.focus) || session.title}</h3>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
            {formatMinutes(minutes)}
          </p>
        </div>
        {onDelete && (
          confirm ? (
            <button type="button" className="chip session-delete" onClick={onDelete}>
              確認刪除
            </button>
          ) : (
            <button
              type="button"
              className="chip session-delete"
              onClick={() => setConfirm(true)}
              aria-label="刪除紀錄"
            >
              <Trash2 size={14} />
            </button>
          )
        )}
      </div>
      <div className="log-stats">
        <div>
          <span>動作</span>
          <strong>{doneMoves.length || session.exercises.length}</strong>
        </div>
        <div>
          <span>訓練量</span>
          <strong>{volume.toLocaleString()} kg</strong>
        </div>
        <div>
          <span>消耗</span>
          <strong>{kcal}</strong>
        </div>
      </div>
      {names && <p className="log-preview">{names}</p>}
    </section>
  )
}
