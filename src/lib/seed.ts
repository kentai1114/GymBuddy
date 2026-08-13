import type { AppState } from './types'

export function createSeedState(): AppState {
  return {
    profile: {
      name: 'KEN',
      goal: 'hypertrophy',
      experience: 'intermediate',
      daysPerWeek: 4,
      preferredSplit: 'push_pull_legs',
      bodyWeightKg: 75,
    },
    sessions: [],
    activeSessionId: null,
  }
}
