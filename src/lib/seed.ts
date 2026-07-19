import { subDays, subHours, formatISO } from 'date-fns'
import type { AppState, PlannedExercise, WorkoutSession } from './types'
import { getExercise } from '@/data/exercises'
import { uid } from './utils'

function buildExercise(
  exerciseId: string,
  overrides?: { sets?: number; reps?: number; weight?: number; restSec?: number },
): PlannedExercise {
  const ex = getExercise(exerciseId)!
  const setCount = overrides?.sets ?? ex.defaultSets ?? 3
  const reps = overrides?.reps ?? ex.defaultReps ?? 10
  const restSec = overrides?.restSec ?? ex.defaultRestSec ?? 60

  if (ex.kind === 'cardio') {
    return {
      id: uid('pe'),
      exerciseId,
      kind: 'cardio',
      restSec,
      sets: [
        {
          id: uid('set'),
          targetDurationSec: ex.defaultDurationSec ?? 300,
          completed: true,
          actualDurationSec: ex.defaultDurationSec ?? 300,
        },
      ],
    }
  }

  return {
    id: uid('pe'),
    exerciseId,
    kind: 'strength',
    restSec,
    sets: Array.from({ length: setCount }, () => ({
      id: uid('set'),
      targetReps: reps,
      targetWeight: overrides?.weight,
      completed: true,
      actualReps: reps,
      actualWeight: overrides?.weight,
    })),
  }
}

function completedSession(
  daysAgo: number,
  hoursAgo: number,
  title: string,
  focus: WorkoutSession['focus'],
  goal: string,
  exerciseIds: Array<{ id: string; weight?: number; sets?: number; reps?: number }>,
): WorkoutSession {
  const when = subHours(subDays(new Date(), daysAgo), hoursAgo)
  return {
    id: uid('ws'),
    date: formatISO(when, { representation: 'date' }),
    title,
    focus,
    goal,
    estimatedMinutes: 50,
    exercises: exerciseIds.map((e) =>
      buildExercise(e.id, { weight: e.weight, sets: e.sets, reps: e.reps }),
    ),
    startedAt: formatISO(when),
    completedAt: formatISO(subHours(when, -1)),
    status: 'completed',
    source: 'manual',
  }
}

export function createSeedState(): AppState {
  const sessions: WorkoutSession[] = [
    completedSession(6, 2, 'Push Day', ['chest', 'shoulders', 'arms'], '胸肩力量', [
      { id: 'bench-press', weight: 60, sets: 4, reps: 8 },
      { id: 'incline-db-press', weight: 24, sets: 3, reps: 10 },
      { id: 'ohp', weight: 40, sets: 3, reps: 8 },
      { id: 'triceps-pushdown', weight: 25, sets: 3, reps: 12 },
    ]),
    completedSession(4, 1, 'Pull Day', ['back', 'arms'], '背部厚度', [
      { id: 'pull-up', sets: 4, reps: 6 },
      { id: 'barbell-row', weight: 50, sets: 4, reps: 8 },
      { id: 'lat-pulldown', weight: 45, sets: 3, reps: 10 },
      { id: 'barbell-curl', weight: 30, sets: 3, reps: 10 },
    ]),
    completedSession(2, 3, 'Leg Day', ['legs', 'core'], '下肢力量', [
      { id: 'squat', weight: 80, sets: 4, reps: 6 },
      { id: 'rdl', weight: 60, sets: 3, reps: 8 },
      { id: 'leg-press', weight: 120, sets: 3, reps: 12 },
      { id: 'plank', sets: 3, reps: 1 },
    ]),
    completedSession(1, 5, 'Upper Pump', ['chest', 'back'], '上半身代謝訓練', [
      { id: 'incline-db-press', weight: 22, sets: 3, reps: 12 },
      { id: 'lat-pulldown', weight: 40, sets: 3, reps: 12 },
      { id: 'cable-fly', weight: 15, sets: 3, reps: 15 },
      { id: 'face-pull', weight: 20, sets: 3, reps: 15 },
      { id: 'treadmill-run-5' },
    ]),
  ]

  return {
    profile: {
      name: 'Kent',
      goal: 'hypertrophy',
      experience: 'intermediate',
      daysPerWeek: 4,
      preferredSplit: 'push_pull_legs',
    },
    sessions,
    activeSessionId: null,
    chat: [
      {
        id: uid('msg'),
        role: 'coach',
        content:
          '你好，我係你嘅 AI Coach。你可以問我今日應該練咩、點樣加重量、或者休息夠唔夠。',
        createdAt: formatISO(new Date()),
      },
    ],
  }
}
