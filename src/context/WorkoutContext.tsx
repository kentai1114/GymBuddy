import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppState,
  ChatMessage,
  PlannedSet,
  UserProfile,
  WorkoutSession,
} from '@/lib/types'
import type { SuggestionResult } from '@/lib/ai-suggest'
import { loadState, saveState } from '@/lib/storage'
import { suggestWorkoutWithLlm } from '@/lib/ai-suggest'
import { coachReply } from '@/lib/coach'
import { uid } from '@/lib/utils'

interface WorkoutContextValue {
  state: AppState
  todaySession: WorkoutSession | null
  chatLoading: boolean
  setProfile: (profile: UserProfile) => void
  adoptSuggestion: (session?: WorkoutSession) => Promise<WorkoutSession>
  generateSuggestion: () => Promise<SuggestionResult>
  startSession: (sessionId: string) => void
  completeSet: (
    sessionId: string,
    exerciseId: string,
    setId: string,
    patch?: Partial<PlannedSet>,
  ) => void
  finishSession: (sessionId: string) => void
  sendChat: (text: string) => Promise<void>
  clearActive: () => void
  updateSession: (session: WorkoutSession) => void
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null)

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  const todaySession = useMemo(() => {
    if (state.activeSessionId) {
      return state.sessions.find((s) => s.id === state.activeSessionId) ?? null
    }
    const today = new Date().toISOString().slice(0, 10)
    return (
      state.sessions.find(
        (s) =>
          s.date === today && (s.status === 'planned' || s.status === 'in_progress'),
      ) ?? null
    )
  }, [state])

  const setProfile = (profile: UserProfile) => {
    setState((prev) => ({ ...prev, profile }))
  }

  const generateSuggestion = useCallback(async () => {
    return suggestWorkoutWithLlm(state.sessions, state.profile)
  }, [state.sessions, state.profile])

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

  const updateSession = (session: WorkoutSession) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === session.id ? session : s)),
    }))
  }

  const startSession = (sessionId: string) => {
    setState((prev) => ({
      ...prev,
      activeSessionId: sessionId,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, status: 'in_progress', startedAt: s.startedAt ?? new Date().toISOString() }
          : s,
      ),
    }))
  }

  const completeSet = (
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
  }

  const finishSession = (sessionId: string) => {
    setState((prev) => ({
      ...prev,
      activeSessionId: null,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, status: 'completed', completedAt: new Date().toISOString() }
          : s,
      ),
    }))
  }

  const clearActive = () => {
    setState((prev) => ({ ...prev, activeSessionId: null }))
  }

  const sendChat = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: uid('msg'),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }

    setChatLoading(true)
    setState((prev) => {
      const snapshot: AppState = { ...prev, chat: [...prev.chat, userMsg] }
      void coachReply(text, snapshot)
        .then((reply) => {
          setState((inner) => ({ ...inner, chat: [...inner.chat, reply] }))
        })
        .finally(() => setChatLoading(false))
      return snapshot
    })
  }, [])

  const value: WorkoutContextValue = {
    state,
    todaySession,
    chatLoading,
    setProfile,
    adoptSuggestion,
    generateSuggestion,
    startSession,
    completeSet,
    finishSession,
    sendChat,
    clearActive,
    updateSession,
  }

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext)
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider')
  return ctx
}
