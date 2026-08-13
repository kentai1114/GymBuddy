import { differenceInMinutes, parseISO } from 'date-fns'
import type { UserProfile, WorkoutSession } from './types'

export const TARGET_MINUTES = 60
export const DEFAULT_BODY_KG = 75

export function sessionVolumeKg(session: WorkoutSession): number {
  return session.exercises.reduce((sum, exercise) => {
    return (
      sum +
      exercise.sets.reduce((inner, set) => {
        if (!set.completed) return inner
        const reps = set.actualReps ?? 0
        const weight = set.actualWeight ?? 0
        return inner + reps * weight
      }, 0)
    )
  }, 0)
}

export function sessionMinutes(session: WorkoutSession): number {
  if (session.actualMinutes && session.actualMinutes > 0) return session.actualMinutes
  if (session.startedAt && session.completedAt) {
    return Math.max(
      1,
      differenceInMinutes(parseISO(session.completedAt), parseISO(session.startedAt)),
    )
  }
  return session.estimatedMinutes || TARGET_MINUTES
}

export function estimateKcal(
  minutes: number,
  session: WorkoutSession,
  bodyWeightKg = DEFAULT_BODY_KG,
): number {
  const hasCardio = session.exercises.some((exercise) => exercise.kind === 'cardio')
  const met = hasCardio ? 6.5 : 6
  return Math.max(1, Math.round(met * bodyWeightKg * (minutes / 60)))
}

export function sessionKcal(session: WorkoutSession, bodyWeightKg = DEFAULT_BODY_KG): number {
  if (session.kcal && session.kcal > 0) return session.kcal
  return estimateKcal(sessionMinutes(session), session, bodyWeightKg)
}

export interface PeriodStats {
  count: number
  minutes: number
  kcal: number
  volumeKg: number
}

export function summarizeSessions(
  sessions: WorkoutSession[],
  profile?: Pick<UserProfile, 'bodyWeightKg'>,
): PeriodStats {
  const bodyKg = profile?.bodyWeightKg || DEFAULT_BODY_KG
  return sessions.reduce<PeriodStats>(
    (acc, session) => ({
      count: acc.count + 1,
      minutes: acc.minutes + sessionMinutes(session),
      kcal: acc.kcal + sessionKcal(session, bodyKg),
      volumeKg: acc.volumeKg + sessionVolumeKg(session),
    }),
    { count: 0, minutes: 0, kcal: 0, volumeKg: 0 },
  )
}

export function finishStats(
  session: WorkoutSession,
  bodyWeightKg = DEFAULT_BODY_KG,
  completedAt = new Date(),
): Pick<WorkoutSession, 'actualMinutes' | 'kcal' | 'completedAt'> {
  const started = session.startedAt ? parseISO(session.startedAt) : completedAt
  const actualMinutes = Math.max(1, differenceInMinutes(completedAt, started))
  return {
    actualMinutes,
    kcal: estimateKcal(actualMinutes, session, bodyWeightKg),
    completedAt: completedAt.toISOString(),
  }
}
