import type { AppState, UserProfile } from './types'

export const DEFAULT_PROFILE: UserProfile = {
  name: 'KEN',
  goal: 'hypertrophy',
  experience: 'intermediate',
  daysPerWeek: 4,
  preferredSplit: 'push_pull_legs',
  bodyWeightKg: 75,
}

const GOALS = new Set<UserProfile['goal']>(['strength', 'hypertrophy', 'fat_loss', 'endurance'])
const EXPERIENCE = new Set<UserProfile['experience']>(['beginner', 'intermediate', 'advanced'])
const SPLITS = new Set<UserProfile['preferredSplit']>([
  'push_pull_legs',
  'upper_lower',
  'full_body',
  'bro_split',
])

export function normalizeProfile(raw?: Partial<UserProfile> | null): UserProfile {
  const name = raw?.name?.trim() || DEFAULT_PROFILE.name
  const body = Number(raw?.bodyWeightKg)
  return {
    name,
    goal: raw?.goal && GOALS.has(raw.goal) ? raw.goal : DEFAULT_PROFILE.goal,
    experience:
      raw?.experience && EXPERIENCE.has(raw.experience)
        ? raw.experience
        : DEFAULT_PROFILE.experience,
    daysPerWeek: [2, 3, 4, 5, 6].includes(Number(raw?.daysPerWeek))
      ? Number(raw?.daysPerWeek)
      : DEFAULT_PROFILE.daysPerWeek,
    preferredSplit:
      raw?.preferredSplit && SPLITS.has(raw.preferredSplit)
        ? raw.preferredSplit
        : DEFAULT_PROFILE.preferredSplit,
    bodyWeightKg: Number.isFinite(body) && body >= 30 ? body : DEFAULT_PROFILE.bodyWeightKg,
  }
}

export function createSeedState(): AppState {
  return {
    profile: { ...DEFAULT_PROFILE },
    sessions: [],
    activeSessionId: null,
  }
}
