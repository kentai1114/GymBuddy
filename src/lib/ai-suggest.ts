import { differenceInHours, parseISO } from 'date-fns'
import type {
  Exercise,
  MuscleGroup,
  PlannedExercise,
  SuggestInput,
  UserProfile,
  WorkoutSession,
} from './types'
import { EXERCISES, getExercise, MUSCLE_LABELS } from '@/data/exercises'
import { lastCompleted, localDateKey, uid, formatMinutes } from './utils'
import { chatCompletion, extractJsonObject } from './openai'
import { progressWeight, suggestStartWeight, usesWeight } from './loading'
import { hasLlmConfigured, resolveLlm } from './settings'
import { TARGET_MINUTES } from './stats'

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
    title: '今日練胸肩',
    goal: '胸、肩、三頭 — 跟住示範片做就得',
    exerciseIds: ['bench-press', 'incline-db-press', 'ohp', 'lateral-raise', 'triceps-pushdown'],
    estimatedMinutes: TARGET_MINUTES,
    reason: '呢啲部位已經休息夠，今日推類最啱。',
  },
  {
    focus: ['back', 'arms'],
    title: '今日練背',
    goal: '背同二頭 — 跟住示範片做就得',
    exerciseIds: ['pull-up', 'barbell-row', 'lat-pulldown', 'face-pull', 'barbell-curl'],
    estimatedMinutes: TARGET_MINUTES,
    reason: '背部同手臂已恢復，今日拉類最啱。',
  },
  {
    focus: ['legs', 'core'],
    title: '今日練腿',
    goal: '下肢同核心 — 跟住示範片做就得',
    exerciseIds: ['squat', 'rdl', 'leg-press', 'walking-lunge', 'hanging-leg-raise'],
    estimatedMinutes: TARGET_MINUTES,
    reason: '腿已經休息夠，今日練下肢。',
  },
  {
    focus: ['shoulders', 'core', 'cardio'],
    title: '今日練肩',
    goal: '肩部 + 輕有氧收尾 — 跟住示範片做就得',
    exerciseIds: ['ohp', 'lateral-raise', 'face-pull', 'plank', 'treadmill-run-5'],
    estimatedMinutes: TARGET_MINUTES,
    reason: '大肌群仲要休息，今日做肩同輕有氧。',
  },
  {
    focus: ['full_body', 'cardio'],
    title: '今日全身',
    goal: '全身複合動作 — 跟住示範片做就得',
    exerciseIds: ['kettlebell-swing', 'squat', 'pull-up', 'bench-press', 'bike-intervals'],
    estimatedMinutes: TARGET_MINUTES,
    reason: '幾個部位都恢復得差唔多，今日全身帶過。',
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
  const ordered = [...sessions]
    .filter((s) => s.status === 'completed' && s.completedAt)
    .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))

  for (const s of ordered) {
    for (const e of s.exercises) {
      if (e.exerciseId !== exerciseId) continue
      const lastSet = [...e.sets]
        .reverse()
        .find((x) => (x.actualWeight ?? x.targetWeight) != null)
      const w = lastSet?.actualWeight ?? lastSet?.targetWeight
      if (w != null) return w
    }
  }
  return undefined
}

function scaleSets(ex: Exercise, minutes: number, override?: number): number {
  if (override != null) return override
  let sets = ex.defaultSets ?? 3
  if (minutes >= 150) sets += 1
  else if (minutes >= 120) sets += 1
  else if (minutes >= 90 && sets >= 4) sets += 1
  else if (minutes <= 45 && sets >= 4) sets -= 1
  return Math.max(2, sets)
}

function scaleCardioSec(ex: Exercise, minutes: number, override?: number): number {
  if (override != null) return override
  const base = ex.defaultDurationSec ?? 300
  if (minutes >= 150) return Math.round(base * 1.6)
  if (minutes >= 120) return Math.round(base * 1.4)
  if (minutes >= 90) return Math.round(base * 1.2)
  return base
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
  minutes = TARGET_MINUTES,
): PlannedExercise[] {
  return exerciseIds.map((exerciseId) => {
    const ex = getExercise(exerciseId)
    if (!ex) {
      throw new Error(`未知動作: ${exerciseId}`)
    }
    const detail = details?.find((d) => d.exerciseId === exerciseId)
    const restSec = detail?.restSec ?? ex.defaultRestSec ?? (ex.kind === 'cardio' ? 60 : 75)
    const prev = lastWeight(sessions, exerciseId)
    const weight =
      detail?.weight ??
      (prev != null
        ? progressWeight(ex, profile, prev)
        : suggestStartWeight(ex, profile, detail?.reps))

    if (ex.kind === 'cardio') {
      return {
        id: uid('pe'),
        exerciseId,
        kind: 'cardio',
        restSec,
        sets: [
          {
            id: uid('set'),
            targetDurationSec: scaleCardioSec(ex, minutes, detail?.durationSec),
            completed: false,
          },
        ],
      }
    }

    if (ex.kind === 'timed') {
      const sets = scaleSets(ex, minutes, detail?.sets)
      const hold = detail?.durationSec ?? ex.defaultDurationSec ?? 45
      return {
        id: uid('pe'),
        exerciseId,
        kind: 'timed',
        restSec,
        sets: Array.from({ length: sets }, () => ({
          id: uid('set'),
          targetDurationSec: hold,
          targetWeight: usesWeight(ex) ? weight : undefined,
          completed: false,
        })),
      }
    }

    const sets = scaleSets(ex, minutes, detail?.sets)
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

/** Flags plans whose weights came from body-weight estimates instead of history. */
function weightNote(
  sessions: WorkoutSession[],
  session: WorkoutSession,
  profile: UserProfile,
): string {
  const estimated = session.exercises.some(
    (pe) => pe.sets[0]?.targetWeight != null && lastWeight(sessions, pe.exerciseId) == null,
  )
  if (!estimated) return ''
  return `未做過嘅動作，重量係按你 ${profile.bodyWeightKg}kg 體重同「${profile.experience === 'beginner' ? '新手' : profile.experience === 'advanced' ? '進階' : '中階'}」估嘅起步值，第一組當試重，唔順就即場改。`
}

function recoveryNotes(sessions: WorkoutSession[]): string[] {
  return (['chest', 'back', 'shoulders', 'arms', 'legs'] as MuscleGroup[]).map((m) => {
    const hours = hoursSinceMuscle(sessions, m)
    const need = RECOVERY_HOURS[m] ?? 48
    if (hours >= need) return `${MUSCLE_LABELS[m]}: 已恢復（${hours}h）`
    return `${MUSCLE_LABELS[m]}: 尚需約 ${need - hours}h`
  })
}

export interface SuggestionResult {
  session: WorkoutSession
  reason: string
  recoveryNotes: string[]
  source: 'llm' | 'heuristic'
  model?: string
}

function resolveFocus(focus: MuscleGroup[]): MuscleGroup[] {
  if (focus.includes('full_body')) {
    return ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']
  }
  return focus.filter((m) => VALID_MUSCLES.has(m))
}

export function targetExerciseCount(minutes: number): number {
  if (minutes <= 45) return 4
  if (minutes <= 60) return 5
  if (minutes <= 90) return 8
  if (minutes <= 120) return 10
  if (minutes <= 150) return 12
  return 14
}

function isCompound(ex: Exercise): boolean {
  return (
    ex.kind === 'strength' &&
    (ex.equipment === 'barbell' ||
      ex.id === 'pull-up' ||
      ex.id === 'chest-dip' ||
      ex.id === 'kettlebell-swing')
  )
}

const SYNERGY: Partial<Record<MuscleGroup, MuscleGroup[]>> = {
  chest: ['shoulders', 'arms'],
  back: ['arms'],
  shoulders: ['arms'],
  legs: ['core'],
  arms: ['shoulders'],
  cardio: ['full_body', 'legs'],
  core: ['cardio'],
}

function pickExerciseIds(focus: MuscleGroup[], minutes: number): string[] {
  const muscles = resolveFocus(focus)
  const count = targetExerciseCount(minutes)
  const picked: string[] = []
  const used = new Set<string>()

  const primary = muscles.length ? muscles : (['full_body'] as MuscleGroup[])

  const listFor = (m: MuscleGroup) =>
    EXERCISES.filter((e) => e.muscle === m).sort((a, b) => {
      const ca = isCompound(a) ? 1 : 0
      const cb = isCompound(b) ? 1 : 0
      return cb - ca
    })

  let guard = 0
  while (picked.length < count && guard < 24) {
    for (const m of primary) {
      const next = listFor(m).find((e) => !used.has(e.id))
      if (next) {
        picked.push(next.id)
        used.add(next.id)
      }
      if (picked.length >= count) break
    }
    guard += 1
  }

  if (picked.length < count) {
    const synergy = primary.flatMap((m) => SYNERGY[m] ?? [])
    const fillMuscles = [...new Set([...primary, ...synergy])]
    const extras = EXERCISES.filter(
      (e) =>
        !used.has(e.id) &&
        (fillMuscles.includes(e.muscle) ||
          e.secondaryMuscles.some((m) => primary.includes(m))),
    ).sort((a, b) => Number(isCompound(b)) - Number(isCompound(a)))
    for (const e of extras) {
      picked.push(e.id)
      used.add(e.id)
      if (picked.length >= count) break
    }
  }

  if (minutes >= 90 && !picked.some((id) => getExercise(id)?.muscle === 'core')) {
    const core = EXERCISES.find((e) => e.muscle === 'core' && !used.has(e.id))
    if (core) {
      if (picked.length >= count) {
        const drop = [...picked].reverse().find((id) => getExercise(id)?.kind !== 'cardio')
        if (drop) {
          picked.splice(picked.indexOf(drop), 1)
          used.delete(drop)
        }
      }
      picked.push(core.id)
      used.add(core.id)
    }
  }

  if (minutes >= 120 && !picked.some((id) => getExercise(id)?.kind === 'cardio')) {
    const cardio =
      EXERCISES.find((e) => e.id === (minutes >= 150 ? 'treadmill-run-10' : 'treadmill-run-5')) ??
      EXERCISES.find((e) => e.kind === 'cardio' && !used.has(e.id))
    if (cardio && !used.has(cardio.id)) picked.push(cardio.id)
  }

  return picked.slice(0, Math.max(count, minutes >= 120 ? count + 1 : count))
}

function planTitle(focus: MuscleGroup[], minutes: number): string {
  const isFull =
    focus.includes('full_body') && focus.every((m) => m === 'full_body' || m === 'cardio')
  const names = isFull
    ? focus.includes('cardio')
      ? '全身有氧'
      : '全身'
    : focus
        .filter((m) => m !== 'full_body')
        .map((m) => MUSCLE_LABELS[m])
        .join('')
  const label = names || '全身'
  if (minutes >= 120) return `${Math.round((minutes / 60) * 10) / 10}小時${label}`
  return `今日練${label}`
}

function freshnessWarning(sessions: WorkoutSession[], focus: MuscleGroup[]): string {
  const tired = resolveFocus(focus).filter((m) => {
    const hours = hoursSinceMuscle(sessions, m)
    const need = RECOVERY_HOURS[m] ?? 48
    return hours < need
  })
  if (!tired.length) return ''
  return `留意：${tired.map((m) => MUSCLE_LABELS[m]).join('、')}仲未完全恢復，課表會偏可控重量。`
}

function buildCustomPlan(
  sessions: WorkoutSession[],
  profile: UserProfile,
  input: SuggestInput,
): SuggestionResult {
  const minutes = input.minutes && input.minutes > 0 ? input.minutes : TARGET_MINUTES
  const focus = (input.focus ?? []).filter((m) => VALID_MUSCLES.has(m))
  const resolved = focus.length ? focus : (['full_body'] as MuscleGroup[])
  const exerciseIds = pickExerciseIds(resolved, minutes)
  const warn = freshnessWarning(sessions, resolved)
  const title = planTitle(focus.length ? focus : resolved, minutes)
  const session: WorkoutSession = {
    id: uid('ws'),
    date: localDateKey(),
    title,
    focus: resolved,
    goal: `跟住每個動作嘅示範片做。預計 ${formatMinutes(minutes)}，共 ${exerciseIds.length} 個動作。`,
    estimatedMinutes: minutes,
    exercises: buildPlannedExercises(exerciseIds, sessions, profile, undefined, minutes),
    status: 'planned',
    source: 'ai',
  }

  const reason = [
    `你揀咗${resolved.map((m) => MUSCLE_LABELS[m]).join('、')}，時長 ${formatMinutes(minutes)}。`,
    minutes >= 120
      ? '長課會分複合動作 → 孤立動作 → 核心／有氧收尾，中間記得飲水。'
      : '複合動作先行，再補孤立同核心。',
    warn,
    profile.goal === 'hypertrophy'
      ? '依你嘅增肌目標，組數偏中高、休息 60–90 秒。'
      : profile.goal === 'strength'
        ? '依你嘅力量目標，複合動作優先並略微加重量。'
        : '節奏會偏向代謝與持續輸出。',
    weightNote(sessions, session, profile),
  ]
    .filter(Boolean)
    .join(' ')

  return { session, reason, recoveryNotes: recoveryNotes(sessions), source: 'heuristic' }
}

export function suggestWorkoutHeuristic(
  sessions: WorkoutSession[],
  profile: UserProfile,
  input?: SuggestInput,
): SuggestionResult {
  if (input?.focus?.length) {
    return buildCustomPlan(sessions, profile, {
      focus: input.focus,
      minutes: input.minutes ?? TARGET_MINUTES,
    })
  }

  const ranked = [...TEMPLATES]
    .map((plan) => ({ plan, score: scorePlan(plan, sessions) }))
    .sort((a, b) => b.score - a.score)

  const best = ranked[0].plan
  const notes = recoveryNotes(sessions)
  const minutes = input?.minutes ?? TARGET_MINUTES
  const exerciseIds =
    minutes === TARGET_MINUTES ? best.exerciseIds : pickExerciseIds(best.focus, minutes)

  const session: WorkoutSession = {
    id: uid('ws'),
    date: localDateKey(),
    title: minutes >= 120 ? planTitle(best.focus, minutes) : best.title,
    focus: best.focus,
    goal: best.goal,
    estimatedMinutes: minutes,
    exercises: buildPlannedExercises(exerciseIds, sessions, profile, undefined, minutes),
    status: 'planned',
    source: 'ai',
  }

  const last = lastCompleted(sessions)
  const reason = [
    best.reason,
    last
      ? `上次係「${last.title}」，今日轉做「${session.title}」避免重複刺激。`
      : '未有足夠記錄，先由平衡模板開始。',
    minutes >= 120 ? `呢堂拉長到 ${formatMinutes(minutes)}，會加配件同收尾。` : '',
    profile.goal === 'hypertrophy'
      ? '依你嘅增肌目標，組數偏中高、休息 60–90 秒。'
      : profile.goal === 'strength'
        ? '依你嘅力量目標，複合動作優先並略微加重量。'
        : '節奏會偏向代謝與持續輸出。',
    weightNote(sessions, session, profile),
  ]
    .filter(Boolean)
    .join(' ')

  return { session, reason, recoveryNotes: notes, source: 'heuristic' }
}

/** Sync preview helper (heuristic). Prefer suggestWorkout() for real AI. */
export function suggestWorkout(
  sessions: WorkoutSession[],
  profile: UserProfile,
  input?: SuggestInput,
): SuggestionResult {
  return suggestWorkoutHeuristic(sessions, profile, input)
}

function buildHistoryContext(
  sessions: WorkoutSession[],
  profile: UserProfile,
  input?: SuggestInput,
): string {
  const recent = [...sessions]
    .filter((s) => s.status === 'completed' && s.completedAt)
    .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))
    .slice(0, 8)

  const catalog = EXERCISES.map((e) => {
    const start = suggestStartWeight(e, profile)
    const load = start != null ? `start ${start}kg` : 'bodyweight'
    return `${e.id} | ${e.nameZh} | ${e.muscle} | ${e.kind} | ${e.equipment} | ${load}`
  }).join('\n')

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

  const minutes = input?.minutes ?? TARGET_MINUTES
  const wanted = input?.focus?.length ? input.focus.join(', ') : '(let recovery decide)'

  return `Profile: ${JSON.stringify(profile)}
Requested muscles: ${wanted}
Requested duration minutes: ${minutes}
Target exercise count: ${targetExerciseCount(minutes)}
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
  input?: SuggestInput,
): Promise<SuggestionResult> {
  if (!hasLlmConfigured()) {
    return suggestWorkoutHeuristic(sessions, profile, input)
  }

  const fallback = suggestWorkoutHeuristic(sessions, profile, input)
  const minutes = input?.minutes ?? TARGET_MINUTES
  const count = targetExerciseCount(minutes)

  try {
    const content = await chatCompletion({
      json: true,
      maxTokens: minutes >= 120 ? 2200 : 1600,
      messages: [
        {
          role: 'system',
          content: `You are GymBuddy. Design ONE gym session the user can follow move-by-move.
Return ONLY a JSON object with keys:
title (short Cantonese), focus (array of muscle ids), goal (one Cantonese sentence telling them to follow the demo video),
estimatedMinutes (number), reason (short Cantonese: why this session),
exercises (array of {exerciseId, sets?, reps?, restSec?, weight?, durationSec?}).
Rules:
- Use ONLY exerciseId values from the catalog.
- Honor requested muscles if provided. Prefer recovered muscles if user asked you to choose.
- estimatedMinutes MUST be ${minutes}.
- Use about ${count} exercises so the session lasts ${minutes} minutes (including rest).
- For 90+ minutes: compounds first, then accessories, finish with core.
- For 120+ minutes: two blocks (A then B), more isolation, and a cardio or core finisher. Mention hydration in goal.
- 3-5 sets for compounds, 2-4 for isolation, rest 60-120s.
- For kind=timed (plank, wall-sit, holds): use durationSec in seconds, never reps.
- For kind=cardio: one set, durationSec in seconds.
- ALWAYS set weight (kg) for every exercise whose equipment is barbell, dumbbell, cable, machine or kettlebell. Never return reps without a weight for those.
- The catalog gives a "start Xkg" reference sized to this user's body weight and level: use it, or beat it when history shows they already lift more.
- Dumbbell and kettlebell weights are per hand. Barbell weights include the bar.
- Only bodyweight and cardio moves may omit weight.
- Keep JSON valid.`,
        },
        {
          role: 'user',
          content: `Design today's workout.\n\n${buildHistoryContext(sessions, profile, input)}`,
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

    const focus = (parsed.focus ?? input?.focus ?? [])
      .filter((m): m is MuscleGroup => VALID_MUSCLES.has(m as MuscleGroup))
      .slice(0, 6)

    const session: WorkoutSession = {
      id: uid('ws'),
      date: localDateKey(),
      title: parsed.title?.trim() || fallback.session.title,
      focus: focus.length ? focus : fallback.session.focus,
      goal: parsed.goal?.trim() || fallback.session.goal,
      estimatedMinutes: minutes,
      exercises: buildPlannedExercises(
        exerciseIds.slice(0, 16),
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
        minutes,
      ),
      status: 'planned',
      source: 'ai',
    }

    return {
      session,
      reason: [parsed.reason?.trim() || fallback.reason, weightNote(sessions, session, profile)]
        .filter(Boolean)
        .join(' '),
      recoveryNotes: fallback.recoveryNotes,
      source: 'llm',
      model: (() => {
        const llm = resolveLlm()
        return llm.kind === 'local' ? undefined : llm.model
      })(),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LLM 失敗'
    return {
      ...fallback,
      reason: `${fallback.reason}\n\n（LLM 不可用：${msg}，已回退本地建議）`,
    }
  }
}
