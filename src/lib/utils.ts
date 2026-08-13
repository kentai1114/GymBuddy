import { formatDistanceToNow, format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { MuscleGroup, PlannedExercise, WorkoutSession } from './types'
import { MUSCLE_LABELS } from '@/data/exercises'

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
}

export function localDateKey(day = new Date()): string {
  return format(day, 'yyyy-MM-dd')
}

export function formatRelative(iso?: string): string {
  if (!iso) return '尚未訓練'
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: zhTW })
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'M月d日 HH:mm', { locale: zhTW })
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'M月d日 EEE', { locale: zhTW })
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} 分鐘`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} 小時 ${m} 分` : `${h} 小時`
}

export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

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

export function muscleLabel(groups: MuscleGroup[]): string {
  return groups.map((g) => MUSCLE_LABELS[g] ?? g).join(' · ')
}

export function sessionProgress(session: WorkoutSession): number {
  const sets = session.exercises.flatMap((e) => e.sets)
  if (!sets.length) return 0
  const done = sets.filter((s) => s.completed).length
  return Math.round((done / sets.length) * 100)
}

export function getWeekDays(base = new Date()): Date[] {
  const start = startOfWeek(base, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function sessionsOnDay(sessions: WorkoutSession[], day: Date): WorkoutSession[] {
  const key = localDateKey(day)
  return sessions.filter((s) => {
    if (s.status !== 'completed') return false
    if (s.date === key) return true
    return Boolean(s.completedAt && isSameDay(parseISO(s.completedAt), day))
  })
}

export function lastCompleted(sessions: WorkoutSession[]): WorkoutSession | undefined {
  return [...sessions]
    .filter((s) => s.status === 'completed' && s.completedAt)
    .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))[0]
}
