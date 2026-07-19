import type { AppState } from './types'
import { createSeedState } from './seed'

const KEY = 'forge-gym-app-v1'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return createSeedState()
    return JSON.parse(raw) as AppState
  } catch {
    return createSeedState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}
