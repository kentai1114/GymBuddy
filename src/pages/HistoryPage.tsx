import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import { APP_MARK } from '@/lib/brand'
import { SessionReview } from '@/components/SessionReview'
import { summarizeSessions } from '@/lib/stats'
import { formatMinutes, sessionsOnDay } from '@/lib/utils'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

export function HistoryPage() {
  const { state, deleteSession } = useWorkout()
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(() => new Date())
  const [scope, setScope] = useState<'week' | 'month'>('week')

  const completed = useMemo(
    () => state.sessions.filter((s) => s.status === 'completed'),
    [state.sessions],
  )

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const weekDays = useMemo(() => {
    const start = startOfWeek(selected, { weekStartsOn: 1 })
    const end = endOfWeek(selected, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [selected])

  const monthSessions = useMemo(
    () =>
      completed.filter((s) => {
        const d = new Date(`${s.date}T12:00:00`)
        return isSameMonth(d, cursor)
      }),
    [completed, cursor],
  )

  const weekSessions = useMemo(
    () => weekDays.flatMap((day) => sessionsOnDay(completed, day)),
    [completed, weekDays],
  )

  const scoped = scope === 'week' ? weekSessions : monthSessions
  const stats = summarizeSessions(scoped, state.profile)
  const daySessions = sessionsOnDay(completed, selected)

  return (
    <div className="page stack">
      <header>
        <p className="brand-mark">{APP_MARK}</p>
        <h1 style={{ marginTop: 6 }}>紀錄</h1>
        <p className="page-kicker">撳日曆睇當日做咗咩</p>
      </header>

      <div className="row" style={{ gap: 8 }}>
        <button
          className={`filter-chip${scope === 'week' ? ' active' : ''}`}
          onClick={() => setScope('week')}
        >
          本週
        </button>
        <button
          className={`filter-chip${scope === 'month' ? ' active' : ''}`}
          onClick={() => setScope('month')}
        >
          本月
        </button>
      </div>

      <section className="stat-grid">
        <div className="stat">
          <span className="muted">去咗幾次</span>
          <strong>{stats.count} 堂</strong>
        </div>
        <div className="stat">
          <span className="muted">時間</span>
          <strong>{formatMinutes(stats.minutes)}</strong>
        </div>
        <div className="stat">
          <span className="muted">消耗</span>
          <strong>{stats.kcal.toLocaleString()} kcal</strong>
        </div>
        <div className="stat">
          <span className="muted">訓練量</span>
          <strong>{Math.round(stats.volumeKg).toLocaleString()} kg</strong>
        </div>
      </section>

      <section className="panel">
        <div className="row space-between" style={{ marginBottom: 12 }}>
          <button className="chip" onClick={() => setCursor((d) => addMonths(d, -1))} aria-label="上個月">
            <ChevronLeft size={16} />
          </button>
          <h3>{format(cursor, 'yyyy年M月', { locale: zhTW })}</h3>
          <button className="chip" onClick={() => setCursor((d) => addMonths(d, 1))} aria-label="下個月">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="month-weekdays">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="month-grid">
          {days.map((day) => {
            const items = sessionsOnDay(completed, day)
            const inMonth = isSameMonth(day, cursor)
            const isToday = isSameDay(day, new Date())
            const isSelected = isSameDay(day, selected)
            return (
              <button
                key={day.toISOString()}
                type="button"
                className={`month-day${items.length ? ' done' : ''}${isToday ? ' today' : ''}${
                  isSelected ? ' selected' : ''
                }${!inMonth ? ' muted-day' : ''}`}
                onClick={() => {
                  setSelected(day)
                  if (!inMonth) setCursor(startOfMonth(day))
                }}
              >
                <span>{format(day, 'd')}</span>
                {items.length > 0 && <i />}
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h3 style={{ marginBottom: 10 }}>
          {format(selected, 'M月d日 EEE', { locale: zhTW })}
        </h3>
        {!daySessions.length && (
          <p className="muted" style={{ margin: 0 }}>
            呢日冇去 gym。
          </p>
        )}
        {daySessions.map((session) => (
          <SessionReview
            key={session.id}
            session={session}
            bodyWeightKg={state.profile.bodyWeightKg}
            nested
            onDelete={() => deleteSession(session.id)}
          />
        ))}
      </section>
    </div>
  )
}
