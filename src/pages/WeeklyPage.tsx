import { Link } from 'react-router-dom'
import { format, isSameDay } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useWorkout } from '@/context/WorkoutContext'
import { getWeekDays, muscleLabel, sessionsOnDay } from '@/lib/utils'
import { MUSCLE_LABELS } from '@/data/exercises'
import type { MuscleGroup } from '@/lib/types'

export function WeeklyPage() {
  const { state } = useWorkout()
  const days = getWeekDays()
  const today = new Date()

  const completed = state.sessions.filter((s) => s.status === 'completed' && s.completedAt)
  const weekSessions = days.flatMap((d) => sessionsOnDay(completed, d))

  const muscleHits: Partial<Record<MuscleGroup, number>> = {}
  for (const s of weekSessions) {
    for (const m of s.focus) {
      muscleHits[m] = (muscleHits[m] ?? 0) + 1
    }
  }

  const totalMinutes = weekSessions.reduce((sum, s) => sum + s.estimatedMinutes, 0)

  return (
    <div className="page stack">
      <header>
        <p className="brand-mark">FORGE</p>
        <h1 style={{ marginTop: 8 }}>Weekly Overview</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          一望就知呢週練得齊唔齊、邊個部位仲欠刺激。
        </p>
      </header>

      <section className="stat-grid">
        <div className="stat">
          <span className="muted">完成堂數</span>
          <strong>
            {weekSessions.length}
            <span style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
              {' '}
              / {state.profile.daysPerWeek}
            </span>
          </strong>
        </div>
        <div className="stat">
          <span className="muted">訓練分鐘</span>
          <strong>{totalMinutes}</strong>
        </div>
      </section>

      <section className="panel">
        <h3 style={{ marginBottom: 12 }}>本週日曆</h3>
        <div className="week-grid">
          {days.map((day) => {
            const items = sessionsOnDay(completed, day)
            const done = items.length > 0
            return (
              <div
                key={day.toISOString()}
                className={`week-day${done ? ' done' : ''}${isSameDay(day, today) ? ' today' : ''}`}
                title={items.map((i) => i.title).join(', ')}
              >
                <span>{format(day, 'EEEEE', { locale: zhTW })}</span>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                  {format(day, 'd')}
                </strong>
                <span>{done ? '✓' : '·'}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h3 style={{ marginBottom: 10 }}>部位覆蓋</h3>
        {(Object.keys(MUSCLE_LABELS) as MuscleGroup[])
          .filter((m) => m !== 'full_body')
          .map((m) => {
            const count = muscleHits[m] ?? 0
            const width = Math.min(100, count * 40)
            return (
              <div key={m} style={{ marginBottom: 12 }}>
                <div className="row space-between" style={{ marginBottom: 6 }}>
                  <span>{MUSCLE_LABELS[m]}</span>
                  <span className="muted">{count} 次</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
      </section>

      <section className="panel">
        <h3 style={{ marginBottom: 8 }}>本週訓練</h3>
        {!weekSessions.length && <p className="muted">呢週未有完成記錄。</p>}
        {weekSessions.map((s) => (
          <div key={s.id} className="list-item">
            <div className="badge">{s.focus[0]?.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{s.title}</strong>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                {muscleLabel(s.focus)} · {s.estimatedMinutes} 分鐘
              </p>
            </div>
          </div>
        ))}
      </section>

      <Link to="/suggest" className="btn btn-primary btn-block">
        用 AI 補今日訓練
      </Link>
      <Link to="/" className="btn btn-ghost btn-block">
        返回今日
      </Link>
    </div>
  )
}
