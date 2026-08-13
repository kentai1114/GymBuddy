import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { getExercise } from '@/data/exercises'
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
  const Wrap = nested ? 'div' : 'section'

  return (
    <Wrap className={nested ? '' : 'panel'}>
      <div className="row space-between" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">你做咗</p>
          <h3>{session.title}</h3>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className="chip accent">{muscleLabel(session.focus)}</span>
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
      </div>
      <p className="muted" style={{ margin: '0 0 12px', fontSize: '0.85rem' }}>
        {formatMinutes(minutes)} · {kcal} kcal · {volume.toLocaleString()} kg
      </p>
      {doneMoves.map((pe) => {
        const ex = getExercise(pe.exerciseId)
        const completed = pe.sets.filter((s) => s.completed)
        return (
          <div key={pe.id} className="list-item">
            <div className="badge" style={{ fontSize: '0.75rem' }}>
              {completed.length}
            </div>
            <div style={{ flex: 1 }}>
              <strong>{ex?.nameZh ?? pe.exerciseId}</strong>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
                {pe.kind === 'cardio'
                  ? `${Math.round((completed[0]?.actualDurationSec ?? 0) / 60)} 分鐘`
                  : pe.kind === 'timed'
                    ? completed
                        .map((s) => `${s.actualDurationSec ?? s.targetDurationSec ?? 0} 秒`)
                        .join(' · ')
                    : completed
                        .map((s) => `${s.actualWeight ?? '-'}kg × ${s.actualReps ?? '-'}`)
                        .join(' · ')}
              </p>
            </div>
          </div>
        )
      })}
      {!doneMoves.length && (
        <p className="muted" style={{ margin: 0 }}>
          呢堂未記到完成嘅組。
        </p>
      )}
    </Wrap>
  )
}
