import { muscleRecovery, STATUS_LABEL } from '@/lib/recovery'
import type { WorkoutSession } from '@/lib/types'

export function RecoveryStrip({ sessions }: { sessions: WorkoutSession[] }) {
  const items = muscleRecovery(sessions)
  return (
    <section className="panel recovery-panel">
      <div className="row space-between" style={{ marginBottom: 12 }}>
        <h3>肌肉恢復</h3>
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          愈滿愈可以練
        </span>
      </div>
      <div className="recovery-list">
        {items.map((item) => (
          <div key={item.muscle} className={`recovery-row ${item.status}`}>
            <span>{item.label}</span>
            <div className="recovery-bar" aria-hidden>
              <i style={{ width: `${item.percent}%` }} />
            </div>
            <em>{STATUS_LABEL[item.status]}</em>
          </div>
        ))}
      </div>
    </section>
  )
}
