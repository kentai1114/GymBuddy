import type { AppState } from './types'
import { createSeedState } from './seed'

const KEY = 'gymbuddy-gym-app-v3'

export function loadState(): AppState {
  const seed = createSeedState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...seed,
      ...parsed,
      profile: { ...seed.profile, ...(parsed.profile ?? {}) },
      sessions: parsed.sessions ?? [],
      activeSessionId: parsed.activeSessionId ?? null,
    }
  } catch {
    return seed
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}
