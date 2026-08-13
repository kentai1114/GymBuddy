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
  subDays,
} from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWorkout } from '@/context/WorkoutContext'
import { SessionReview } from '@/components/SessionReview'
import { RecoveryStrip } from '@/components/RecoveryStrip'
import { summarizeSessions } from '@/lib/stats'
import { formatMinutes, localDateKey, sessionsOnDay } from '@/lib/utils'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

export function HistoryPage() {
  const { state, deleteSession } = useWorkout()
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(() => new Date())
  const [showMonth, setShowMonth] = useState(false)

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

  const weekSessions = useMemo(
    () => weekDays.flatMap((day) => sessionsOnDay(completed, day)),
    [completed, weekDays],
  )

  const stats = summarizeSessions(weekSessions, state.profile)
  const daySessions = sessionsOnDay(completed, selected)
  const weekGoal = weeklyGoal(completed, state.profile.daysPerWeek)
  const streak = dayStreak(completed)

  const past = useMemo(
    () =>
      [...completed].sort((a, b) => {
        const da = a.completedAt ?? a.date
        const db = b.completedAt ?? b.date
        return db > da ? 1 : -1
      }),
    [completed],
  )

  return (
    <div className="page stack">
      <header className="log-top">
        <h1 className="display">{state.profile.name.trim() || '紀錄'}</h1>
      </header>

      <section className="stat-grid">
        <div className="stat">
          <span className="muted">本週目標</span>
          <strong>
            {weekGoal.done}/{weekGoal.goal} 日
          </strong>
        </div>
        <div className="stat">
          <span className="muted">連續</span>
          <strong>{streak} 日</strong>
        </div>
      </section>

      <RecoveryStrip sessions={state.sessions} />

      <section className="panel">
        <div className="row space-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            日曆
          </h3>
          <button type="button" className="month-toggle" onClick={() => setShowMonth((v) => !v)}>
            {format(cursor, 'M月', { locale: zhTW })}
          </button>
        </div>

        {!showMonth && (
          <div className="week-strip">
            {weekDays.map((day) => {
              const items = sessionsOnDay(completed, day)
              const isToday = isSameDay(day, new Date())
              const isSelected = isSameDay(day, selected)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={`week-day${items.length ? ' done' : ''}${isToday ? ' today' : ''}${
                    isSelected ? ' selected' : ''
                  }`}
                  onClick={() => setSelected(day)}
                >
                  <span>{format(day, 'EEEEE', { locale: zhTW })}</span>
                  <strong>{format(day, 'd')}</strong>
                </button>
              )
            })}
          </div>
        )}

        {showMonth && (
          <>
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
          </>
        )}
      </section>

      <section className="stat-grid">
        <div className="stat">
          <span className="muted">本週堂數</span>
          <strong>{stats.count}</strong>
        </div>
        <div className="stat">
          <span className="muted">時間</span>
          <strong>{formatMinutes(stats.minutes)}</strong>
        </div>
      </section>

      <h2 className="display section-display">過往訓練</h2>
      {daySessions.length > 0 ? (
        daySessions.map((session) => (
          <SessionReview
            key={session.id}
            session={session}
            bodyWeightKg={state.profile.bodyWeightKg}
            onDelete={() => deleteSession(session.id)}
          />
        ))
      ) : (
        past.slice(0, 8).map((session) => (
          <SessionReview
            key={session.id}
            session={session}
            bodyWeightKg={state.profile.bodyWeightKg}
            onDelete={() => deleteSession(session.id)}
          />
        ))
      )}
      {!completed.length && <p className="muted">未有訓練紀錄。</p>}
    </div>
  )
}

function weeklyGoal(sessions: { date: string; status: string }[], goal: number) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 })
  const days = new Set(
    sessions
      .filter((s) => s.status === 'completed' && s.date >= localDateKey(start))
      .map((s) => s.date),
  )
  return { done: days.size, goal: Math.max(goal, 1) }
}

function dayStreak(sessions: { date: string; completedAt?: string; status: string }[]) {
  const days = new Set(sessions.filter((s) => s.status === 'completed').map((s) => s.date))
  let cursor = new Date()
  if (!days.has(localDateKey(cursor))) cursor = subDays(cursor, 1)
  let n = 0
  while (days.has(localDateKey(cursor))) {
    n += 1
    cursor = subDays(cursor, 1)
    if (n > 365) break
  }
  return n
}
