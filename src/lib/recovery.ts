import { differenceInHours, parseISO } from 'date-fns'
import type { MuscleGroup, WorkoutSession } from './types'
import { MUSCLE_LABELS } from '@/data/exercises'

const NEED: Partial<Record<MuscleGroup, number>> = {
  chest: 48,
  back: 48,
  shoulders: 48,
  arms: 36,
  legs: 72,
  core: 24,
  cardio: 12,
  full_body: 48,
}

const DISPLAY: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']

export type RecoveryStatus = 'fresh' | 'recovering' | 'sore'

export interface MuscleRecovery {
  muscle: MuscleGroup
  label: string
  hours: number
  percent: number
  status: RecoveryStatus
}

function hoursSince(sessions: WorkoutSession[], muscle: MuscleGroup): number {
  let latest: string | undefined
  for (const s of sessions) {
    if (s.status !== 'completed' || !s.completedAt) continue
    if (!s.focus.includes(muscle)) continue
    if (!latest || s.completedAt > latest) latest = s.completedAt
  }
  if (!latest) return 999
  return differenceInHours(new Date(), parseISO(latest))
}

export function muscleRecovery(sessions: WorkoutSession[]): MuscleRecovery[] {
  return DISPLAY.map((muscle) => {
    const hours = hoursSince(sessions, muscle)
    const need = NEED[muscle] ?? 48
    const percent = Math.min(100, Math.round((hours / need) * 100))
    const status: RecoveryStatus = percent >= 100 ? 'fresh' : percent >= 50 ? 'recovering' : 'sore'
    return { muscle, label: MUSCLE_LABELS[muscle], hours, percent, status }
  })
}

export const STATUS_LABEL: Record<RecoveryStatus, string> = {
  fresh: '已恢復',
  recovering: '恢復中',
  sore: '疲勞',
}
