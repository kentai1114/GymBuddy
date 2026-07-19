import {
  createContext,
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
import { loadState, saveState } from '@/lib/storage'
import { suggestWorkout } from '@/lib/ai-suggest'
import { coachReply } from '@/lib/coach'
import { uid } from '@/lib/utils'

interface WorkoutContextValue {
  state: AppState
  todaySession: WorkoutSession | null
  setProfile: (profile: UserProfile) => void
  adoptSuggestion: () => WorkoutSession
  startSession: (sessionId: string) => void
  completeSet: (sessionId: string, exerciseId: string, setId: string, patch?: Partial<PlannedSet>) => void
  finishSession: (sessionId: string) => void
  skipRestAndContinue: () => void
  sendChat: (text: string) => void
  clearActive: () => void
  updateSession: (session: WorkoutSession) => void
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null)

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

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

  const adoptSuggestion = () => {
    const { session } = suggestWorkout(state.sessions, state.profile)
    setState((prev) => ({
      ...prev,
      sessions: [session, ...prev.sessions.filter((s) => s.status !== 'planned')],
      activeSessionId: null,
    }))
    return session
  }

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

  const skipRestAndContinue = () => {
    /* UI-only helper placeholder */
  }

  const sendChat = (text: string) => {
    const userMsg: ChatMessage = {
      id: uid('msg'),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setState((prev) => {
      const next = { ...prev, chat: [...prev.chat, userMsg] }
      const reply = coachReply(text, next)
      return { ...next, chat: [...next.chat, reply] }
    })
  }

  const value: WorkoutContextValue = {
    state,
    todaySession,
    setProfile,
    adoptSuggestion,
    startSession,
    completeSet,
    finishSession,
    skipRestAndContinue,
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
