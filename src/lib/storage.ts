import type { AppState, PlannedExercise, PlannedSet, UserProfile, WorkoutSession } from './types'
import { createSeedState } from './seed'
import { getExercise } from '@/data/exercises'
import { suggestStartWeight, usesWeight } from './loading'

const KEY = 'gymbuddy-gym-app-v3'

export function loadState(): AppState {
  const seed = createSeedState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw) as Partial<AppState>
    const profile = { ...seed.profile, ...(parsed.profile ?? {}) }
    return {
      ...seed,
      ...parsed,
      profile,
      sessions: hydrateSessions(parsed.sessions ?? [], profile),
      activeSessionId: parsed.activeSessionId ?? null,
    }
  } catch {
    return seed
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function hydrateSessions(sessions: WorkoutSession[], profile: UserProfile): WorkoutSession[] {
  return sessions.map((session) => ({
    ...session,
    exercises: session.exercises.map((pe) => hydratePlanned(pe, profile)),
  }))
}

function hydratePlanned(pe: PlannedExercise, profile: UserProfile): PlannedExercise {
  const ex = getExercise(pe.exerciseId)
  if (!ex) return pe
  const kind = pe.kind || ex.kind
  return {
    ...pe,
    kind,
    sets: pe.sets.map((set) => hydrateSet(set, kind, ex, profile)),
  }
}

function hydrateSet(
  set: PlannedSet,
  kind: PlannedExercise['kind'],
  ex: NonNullable<ReturnType<typeof getExercise>>,
  profile: UserProfile,
): PlannedSet {
  if (kind === 'cardio') {
    return { ...set, targetDurationSec: set.targetDurationSec ?? ex.defaultDurationSec ?? 300 }
  }
  if (kind === 'timed') {
    return {
      ...set,
      targetDurationSec: set.targetDurationSec ?? ex.defaultDurationSec ?? 45,
      targetWeight: usesWeight(ex) ? (set.targetWeight ?? suggestStartWeight(ex, profile)) : set.targetWeight,
    }
  }
  return {
    ...set,
    targetReps: set.targetReps ?? ex.defaultReps ?? 10,
    targetWeight: usesWeight(ex) ? (set.targetWeight ?? suggestStartWeight(ex, profile)) : set.targetWeight,
  }
}
