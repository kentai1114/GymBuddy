import { useMemo } from 'react'
import { useWorkout } from '@/context/WorkoutContext'
import { getExercise } from '@/data/exercises'
import { formatDateTime, muscleLabel } from '@/lib/utils'

export function HistoryPage() {
  const { state } = useWorkout()

  const sessions = useMemo(
    () =>
      [...state.sessions]
        .filter((s) => s.status === 'completed')
        .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1)),
    [state.sessions],
  )

  return (
    <div className="page stack">
      <header>
        <p className="brand-mark">FORGE</p>
        <h1 style={{ marginTop: 8 }}>Workout History</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          自動累積每一次訓練，俾 AI 知道你之前做過咩。
        </p>
      </header>

      {!sessions.length && (
        <div className="panel empty">暫未有完成記錄。完成一堂訓練後會顯示喺度。</div>
      )}

      {sessions.map((session) => {
        const volume = session.exercises.reduce((sum, e) => {
          return (
            sum +
            e.sets.reduce((s, set) => {
              if (!set.completed) return s
              const reps = set.actualReps ?? 0
              const weight = set.actualWeight ?? 0
              return s + reps * weight
            }, 0)
          )
        }, 0)

        return (
          <article key={session.id} className="panel">
            <div className="row space-between">
              <div>
                <h3>{session.title}</h3>
                <p className="muted" style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>
                  {session.completedAt ? formatDateTime(session.completedAt) : session.date}
                </p>
              </div>
              <span className="chip">{muscleLabel(session.focus)}</span>
            </div>

            <p style={{ margin: '12px 0 0' }}>{session.goal}</p>

            <div className="stat-grid" style={{ marginTop: 14 }}>
              <div className="stat">
                <span className="muted">動作</span>
                <strong>{session.exercises.length}</strong>
              </div>
              <div className="stat">
                <span className="muted">估計容量</span>
                <strong style={{ fontSize: '1.1rem' }}>{Math.round(volume)} kg</strong>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {session.exercises.map((pe) => {
                const ex = getExercise(pe.exerciseId)
                const doneSets = pe.sets.filter((s) => s.completed).length
                return (
                  <div key={pe.id} className="list-item">
                    <div className="badge" style={{ fontSize: '0.75rem' }}>
                      {doneSets}
                    </div>
                    <div>
                      <strong>{ex?.nameZh ?? pe.exerciseId}</strong>
                      <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
                        {pe.kind === 'cardio'
                          ? `${Math.round((pe.sets[0]?.actualDurationSec ?? 0) / 60)} 分鐘`
                          : pe.sets
                              .filter((s) => s.completed)
                              .map(
                                (s) =>
                                  `${s.actualWeight ?? '-'}kg × ${s.actualReps ?? '-'}`,
                              )
                              .join(' · ')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        )
      })}
    </div>
  )
}
