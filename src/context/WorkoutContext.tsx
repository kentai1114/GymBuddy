import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, PlannedExercise, PlannedSet, SuggestInput, UserProfile, WorkoutSession } from '@/lib/types'
import type { SuggestionResult } from '@/lib/ai-suggest'
import { loadState, saveState } from '@/lib/storage'
import { buildPlannedExercises, suggestWorkoutWithLlm } from '@/lib/ai-suggest'
import { finishStats } from '@/lib/stats'
import { localDateKey, uid } from '@/lib/utils'
import { normalizeProfile } from '@/lib/seed'

interface WorkoutContextValue {
  state: AppState
  todaySession: WorkoutSession | null
  completedToday: WorkoutSession | null
  completedTodayList: WorkoutSession[]
  adoptSuggestion: (session?: WorkoutSession) => Promise<WorkoutSession>
  generateSuggestion: (input?: SuggestInput) => Promise<SuggestionResult>
  startSession: (sessionId: string) => void
  updateProfile: (patch: Partial<UserProfile>) => void
  updateSet: (
    sessionId: string,
    exerciseId: string,
    setId: string,
    patch: Partial<PlannedSet>,
  ) => void
  replaceExercise: (sessionId: string, plannedId: string, newExerciseId: string) => void
  addSet: (sessionId: string, plannedId: string) => void
  updatePlanned: (
    sessionId: string,
    plannedId: string,
    patch: Partial<Pick<PlannedExercise, 'restSec' | 'notes'>>,
  ) => void
  completeSet: (
    sessionId: string,
    exerciseId: string,
    setId: string,
    patch?: Partial<PlannedSet>,
  ) => void
  finishSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null)

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const todayKey = localDateKey()

  const completedTodayList = useMemo(() => {
    return state.sessions.filter((s) => s.status === 'completed' && s.date === todayKey)
  }, [state.sessions, todayKey])

  const completedToday = completedTodayList[0] ?? null

  const todaySession = useMemo(() => {
    if (state.activeSessionId) {
      const active = state.sessions.find((s) => s.id === state.activeSessionId) ?? null
      if (active && active.status !== 'completed') return active
    }
    return (
      state.sessions.find(
        (s) =>
          s.date === todayKey && (s.status === 'planned' || s.status === 'in_progress'),
      ) ?? null
    )
  }, [state, todayKey])

  const generateSuggestion = useCallback(
    async (input?: SuggestInput) => {
      return suggestWorkoutWithLlm(state.sessions, state.profile, input)
    },
    [state.sessions, state.profile],
  )

  const adoptSuggestion = useCallback(
    async (session?: WorkoutSession) => {
      const next =
        session ?? (await suggestWorkoutWithLlm(state.sessions, state.profile)).session
      setState((prev) => ({
        ...prev,
        sessions: [next, ...prev.sessions.filter((s) => s.status !== 'planned')],
        activeSessionId: null,
      }))
      return next
    },
    [state.sessions, state.profile],
  )

  const startSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      activeSessionId: sessionId,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, status: 'in_progress', startedAt: s.startedAt ?? new Date().toISOString() }
          : s,
      ),
    }))
  }, [])

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: normalizeProfile({ ...prev.profile, ...patch }),
    }))
  }, [])

  const updateSet = useCallback(
    (sessionId: string, exerciseId: string, setId: string, patch: Partial<PlannedSet>) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s.id !== sessionId) return s
          return {
            ...s,
            exercises: s.exercises.map((e) => {
              if (e.id !== exerciseId) return e
              return {
                ...e,
                sets: e.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
              }
            }),
          }
        }),
      }))
    },
    [],
  )

  const replaceExercise = useCallback((sessionId: string, plannedId: string, newExerciseId: string) => {
    setState((prev) => {
      const built = buildPlannedExercises(
        [newExerciseId],
        prev.sessions,
        prev.profile,
      )[0]
      return {
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s.id !== sessionId) return s
          return {
            ...s,
            exercises: s.exercises.map((e) =>
              e.id === plannedId ? { ...built, id: e.id } : e,
            ),
          }
        }),
      }
    })
  }, [])

  const addSet = useCallback((sessionId: string, plannedId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => {
        if (s.id !== sessionId) return s
        return {
          ...s,
          exercises: s.exercises.map((e) => {
            if (e.id !== plannedId) return e
            const last = e.sets[e.sets.length - 1]
            const next: PlannedSet = {
              id: uid('set'),
              targetReps: last?.targetReps,
              targetWeight: last?.targetWeight,
              targetDurationSec: last?.targetDurationSec,
              completed: false,
            }
            return { ...e, sets: [...e.sets, next] }
          }),
        }
      }),
    }))
  }, [])

  const updatePlanned = useCallback(
    (
      sessionId: string,
      plannedId: string,
      patch: Partial<Pick<PlannedExercise, 'restSec' | 'notes'>>,
    ) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s.id !== sessionId) return s
          return {
            ...s,
            exercises: s.exercises.map((e) => (e.id === plannedId ? { ...e, ...patch } : e)),
          }
        }),
      }))
    },
    [],
  )

  const completeSet = useCallback(
    (
      sessionId: string,
      exerciseId: string,
      setId: string,
      patch?: Partial<PlannedSet>,
    ) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s.id !== sessionId) return s
          return {
            ...s,
            exercises: s.exercises.map((e) => {
              if (e.id !== exerciseId) return e
              return {
                ...e,
                sets: e.sets.map((set) =>
                  set.id === setId
                    ? {
                        ...set,
                        completed: true,
                        actualReps: patch?.actualReps ?? set.targetReps,
                        actualWeight: patch?.actualWeight ?? set.targetWeight,
                        actualDurationSec: patch?.actualDurationSec ?? set.targetDurationSec,
                      }
                    : set,
                ),
              }
            }),
          }
        }),
      }))
    },
    [],
  )

  const finishSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      activeSessionId: null,
      sessions: prev.sessions.map((s) => {
        if (s.id !== sessionId) return s
        return {
          ...s,
          status: 'completed',
          ...finishStats(s, prev.profile.bodyWeightKg),
        }
      }),
    }))
  }, [])

  const deleteSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      activeSessionId: prev.activeSessionId === sessionId ? null : prev.activeSessionId,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }))
  }, [])

  const value: WorkoutContextValue = {
    state,
    todaySession,
    completedToday,
    completedTodayList,
    adoptSuggestion,
    generateSuggestion,
    startSession,
    updateProfile,
    updateSet,
    replaceExercise,
    addSet,
    updatePlanned,
    completeSet,
    finishSession,
    deleteSession,
  }

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext)
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider')
  return ctx
}
