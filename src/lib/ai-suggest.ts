import { differenceInHours, parseISO, formatISO } from 'date-fns'
import type {
  MuscleGroup,
  PlannedExercise,
  UserProfile,
  WorkoutSession,
} from './types'
import { EXERCISES, getExercise } from '@/data/exercises'
import { lastCompleted, uid } from './utils'
import { chatCompletion, extractJsonObject } from './openrouter'
import { hasLlmConfigured } from './settings'

const RECOVERY_HOURS: Partial<Record<MuscleGroup, number>> = {
  chest: 48,
  back: 48,
  shoulders: 48,
  arms: 36,
  legs: 72,
  core: 24,
  cardio: 12,
  full_body: 48,
}

const VALID_MUSCLES = new Set<MuscleGroup>([
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'cardio',
  'full_body',
])

type FocusPlan = {
  focus: MuscleGroup[]
  title: string
  goal: string
  exerciseIds: string[]
  estimatedMinutes: number
  reason: string
}

const TEMPLATES: FocusPlan[] = [
  {
    focus: ['chest', 'shoulders', 'arms'],
    title: 'Push Strength',
    goal: '胸肩推類力量 + 手臂收尾',
    exerciseIds: ['bench-press', 'incline-db-press', 'ohp', 'lateral-raise', 'triceps-pushdown'],
    estimatedMinutes: 55,
    reason: '推日：胸、前中三角、三頭協同發力。',
  },
  {
    focus: ['back', 'arms'],
    title: 'Pull Thickness',
    goal: '背部厚度與二頭泵感',
    exerciseIds: ['pull-up', 'barbell-row', 'lat-pulldown', 'face-pull', 'barbell-curl'],
    estimatedMinutes: 55,
    reason: '拉日：平衡上半身，強化後鏈與肩胛穩定。',
  },
  {
    focus: ['legs', 'core'],
    title: 'Lower Power',
    goal: '下肢力量與核心穩定',
    exerciseIds: ['squat', 'rdl', 'leg-press', 'walking-lunge', 'hanging-leg-raise'],
    estimatedMinutes: 60,
    reason: '腿日：深蹲 + 鉸鏈動作建立下肢力量。',
  },
  {
    focus: ['shoulders', 'core', 'cardio'],
    title: 'Shoulders & Conditioning',
    goal: '肩部細節 + 5 分鐘有氧收尾',
    exerciseIds: ['ohp', 'lateral-raise', 'face-pull', 'plank', 'treadmill-run-5'],
    estimatedMinutes: 45,
    reason: '恢復日偏輕：肩部保健並維持心肺。',
  },
  {
    focus: ['full_body', 'cardio'],
    title: 'Full Body Forge',
    goal: '全身複合動作 + 代謝刺激',
    exerciseIds: ['kettlebell-swing', 'squat', 'pull-up', 'bench-press', 'bike-intervals'],
    estimatedMinutes: 50,
    reason: '全身日：適合訓練頻率較低或補漏。',
  },
]

function hoursSinceMuscle(sessions: WorkoutSession[], muscle: MuscleGroup): number {
  let latest: string | undefined
  for (const s of sessions) {
    if (s.status !== 'completed' || !s.completedAt) continue
    if (!s.focus.includes(muscle)) continue
    if (!latest || s.completedAt > latest) latest = s.completedAt
  }
  if (!latest) return 999
  return differenceInHours(new Date(), parseISO(latest))
}

function scorePlan(plan: FocusPlan, sessions: WorkoutSession[]): number {
  let score = 0
  for (const m of plan.focus) {
    const hours = hoursSinceMuscle(sessions, m)
    const need = RECOVERY_HOURS[m] ?? 48
    if (hours >= need) score += Math.min(hours / need, 3)
    else score -= (need - hours) / need
  }
  const last = lastCompleted(sessions)
  if (last) {
    const overlap = plan.focus.filter((m) => last.focus.includes(m)).length
    score -= overlap * 0.8
  }
  return score
}

function lastWeight(sessions: WorkoutSession[], exerciseId: string): number | undefined {
  for (const s of [...sessions].reverse()) {
    for (const e of s.exercises) {
      if (e.exerciseId !== exerciseId) continue
      const w = e.sets.map((x) => x.actualWeight ?? x.targetWeight).find((x) => x != null)
      if (w != null) return w
    }
  }
  return undefined
}

export function buildPlannedExercises(
  exerciseIds: string[],
  sessions: WorkoutSession[],
  profile: UserProfile,
  details?: Array<{
    exerciseId: string
    sets?: number
    reps?: number
    restSec?: number
    weight?: number
    durationSec?: number
  }>,
): PlannedExercise[] {
  return exerciseIds.map((exerciseId) => {
    const ex = getExercise(exerciseId)
    if (!ex) {
      throw new Error(`未知動作: ${exerciseId}`)
    }
    const detail = details?.find((d) => d.exerciseId === exerciseId)
    const restSec = detail?.restSec ?? ex.defaultRestSec ?? (ex.kind === 'cardio' ? 60 : 75)
    const prev = lastWeight(sessions, exerciseId)
    const bump = profile.goal === 'strength' ? 2.5 : profile.goal === 'hypertrophy' ? 1.25 : 0
    const weight =
      detail?.weight ??
      (prev != null ? Math.round((prev + bump) * 4) / 4 : undefined)

    if (ex.kind === 'cardio') {
      return {
        id: uid('pe'),
        exerciseId,
        kind: 'cardio',
        restSec,
        sets: [
          {
            id: uid('set'),
            targetDurationSec: detail?.durationSec ?? ex.defaultDurationSec ?? 300,
            completed: false,
          },
        ],
      }
    }

    const sets = detail?.sets ?? ex.defaultSets ?? 3
    const reps = detail?.reps ?? ex.defaultReps ?? 10
    return {
      id: uid('pe'),
      exerciseId,
      kind: 'strength',
      restSec,
      sets: Array.from({ length: sets }, () => ({
        id: uid('set'),
        targetReps: reps,
        targetWeight: weight,
        completed: false,
      })),
    }
  })
}

function recoveryNotes(sessions: WorkoutSession[]): string[] {
  return (['chest', 'back', 'shoulders', 'arms', 'legs'] as MuscleGroup[]).map((m) => {
    const hours = hoursSinceMuscle(sessions, m)
    const need = RECOVERY_HOURS[m] ?? 48
    if (hours >= need) return `${m}: 已恢復（${hours}h）`
    return `${m}: 尚需約 ${need - hours}h`
  })
}

export interface SuggestionResult {
  session: WorkoutSession
  reason: string
  recoveryNotes: string[]
  source: 'llm' | 'heuristic'
  model?: string
}

export function suggestWorkoutHeuristic(
  sessions: WorkoutSession[],
  profile: UserProfile,
): SuggestionResult {
  const ranked = [...TEMPLATES]
    .map((plan) => ({ plan, score: scorePlan(plan, sessions) }))
    .sort((a, b) => b.score - a.score)

  const best = ranked[0].plan
  const notes = recoveryNotes(sessions)

  const session: WorkoutSession = {
    id: uid('ws'),
    date: formatISO(new Date(), { representation: 'date' }),
    title: best.title,
    focus: best.focus,
    goal: best.goal,
    estimatedMinutes: best.estimatedMinutes,
    exercises: buildPlannedExercises(best.exerciseIds, sessions, profile),
    status: 'planned',
    source: 'ai',
  }

  const last = lastCompleted(sessions)
  const reason = [
    best.reason,
    last
      ? `上次係「${last.title}」，今日轉做「${best.title}」避免重複刺激。`
      : '未有足夠記錄，先由平衡模板開始。',
    profile.goal === 'hypertrophy'
      ? '依你嘅增肌目標，組數偏中高、休息 60–90 秒。'
      : profile.goal === 'strength'
        ? '依你嘅力量目標，複合動作優先並略微加重量。'
        : '節奏會偏向代謝與持續輸出。',
  ].join(' ')

  return { session, reason, recoveryNotes: notes, source: 'heuristic' }
}

/** Sync preview helper (heuristic). Prefer suggestWorkout() for real AI. */
export function suggestWorkout(
  sessions: WorkoutSession[],
  profile: UserProfile,
): SuggestionResult {
  return suggestWorkoutHeuristic(sessions, profile)
}

function buildHistoryContext(sessions: WorkoutSession[], profile: UserProfile): string {
  const recent = [...sessions]
    .filter((s) => s.status === 'completed' && s.completedAt)
    .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))
    .slice(0, 8)

  const catalog = EXERCISES.map(
    (e) => `${e.id} | ${e.nameZh} | ${e.muscle} | ${e.kind}`,
  ).join('\n')

  const history = recent
    .map((s) => {
      const moves = s.exercises
        .map((e) => {
          const w = e.sets[0]?.actualWeight ?? e.sets[0]?.targetWeight
          return `${e.exerciseId}${w != null ? `@${w}kg` : ''}`
        })
        .join(', ')
      return `- ${s.completedAt?.slice(0, 10)} ${s.title} [${s.focus.join(',')}] :: ${moves}`
    })
    .join('\n')

  return `Profile: ${JSON.stringify(profile)}
Recovery notes:
${recoveryNotes(sessions).join('\n')}
Recent workouts:
${history || '(none)'}
Exercise catalog (use ONLY these exerciseId values):
${catalog}`
}

type LlmPlan = {
  title?: string
  focus?: string[]
  goal?: string
  estimatedMinutes?: number
  reason?: string
  exercises?: Array<{
    exerciseId?: string
    sets?: number
    reps?: number
    restSec?: number
    weight?: number
    durationSec?: number
  }>
}

export async function suggestWorkoutWithLlm(
  sessions: WorkoutSession[],
  profile: UserProfile,
): Promise<SuggestionResult> {
  if (!hasLlmConfigured()) {
    return suggestWorkoutHeuristic(sessions, profile)
  }

  const fallback = suggestWorkoutHeuristic(sessions, profile)

  try {
    const content = await chatCompletion({
      json: true,
      temperature: 0.5,
      maxTokens: 1400,
      messages: [
        {
          role: 'system',
          content: `You are FORGE, an expert gym programming coach.
Return ONLY a JSON object with keys:
title (string), focus (array of muscle ids), goal (string in Cantonese/Chinese),
estimatedMinutes (number 30-75), reason (string in Cantonese explaining why),
exercises (array of {exerciseId, sets?, reps?, restSec?, weight?, durationSec?}).
Rules:
- Use ONLY exerciseId values from the catalog.
- Prefer recovered muscles; avoid repeating yesterday's main focus.
- 4-6 exercises. Include treadmill-run-5 or bike-intervals if conditioning fits.
- Suggest progressive overload weights when history has prior weights.
- Keep JSON valid.`,
        },
        {
          role: 'user',
          content: `Design today's workout.\n\n${buildHistoryContext(sessions, profile)}`,
        },
      ],
    })

    const parsed = extractJsonObject(content) as LlmPlan
    const exerciseIds = (parsed.exercises ?? [])
      .map((e) => e.exerciseId)
      .filter((id): id is string => Boolean(id && getExercise(id)))

    if (exerciseIds.length < 3) {
      return { ...fallback, reason: `${fallback.reason}（LLM 回傳唔完整，已用本地建議）` }
    }

    const focus = (parsed.focus ?? [])
      .filter((m): m is MuscleGroup => VALID_MUSCLES.has(m as MuscleGroup))
      .slice(0, 4)

    const session: WorkoutSession = {
      id: uid('ws'),
      date: formatISO(new Date(), { representation: 'date' }),
      title: parsed.title?.trim() || fallback.session.title,
      focus: focus.length ? focus : fallback.session.focus,
      goal: parsed.goal?.trim() || fallback.session.goal,
      estimatedMinutes: Math.min(
        90,
        Math.max(25, Number(parsed.estimatedMinutes) || fallback.session.estimatedMinutes),
      ),
      exercises: buildPlannedExercises(
        exerciseIds.slice(0, 7),
        sessions,
        profile,
        parsed.exercises?.filter((e) => e.exerciseId && getExercise(e.exerciseId)) as Array<{
          exerciseId: string
          sets?: number
          reps?: number
          restSec?: number
          weight?: number
          durationSec?: number
        }>,
      ),
      status: 'planned',
      source: 'ai',
    }

    return {
      session,
      reason: parsed.reason?.trim() || fallback.reason,
      recoveryNotes: fallback.recoveryNotes,
      source: 'llm',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LLM 失敗'
    return {
      ...fallback,
      reason: `${fallback.reason}\n\n（OpenRouter 不可用：${msg}，已回退本地建議）`,
    }
  }
}
