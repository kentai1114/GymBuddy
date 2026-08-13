import type { Exercise, UserProfile } from './types'

/**
 * Starting-load estimates so a plan never says "3 組 x 10 次" with no weight.
 *
 * Numbers are a working-set load for the exercise's default rep range,
 * expressed as a fraction of body weight. Dumbbell and kettlebell entries are
 * PER HAND (that is what people read off the rack), everything else is the
 * total on the bar / the pin on the stack.
 */
const BODYWEIGHT_FRACTION: Record<string, number> = {
  // barbell
  'bench-press': 0.6,
  'close-grip-bench': 0.5,
  squat: 0.85,
  'front-squat': 0.65,
  'box-squat': 0.75,
  deadlift: 1.05,
  rdl: 0.75,
  'good-morning': 0.4,
  'barbell-row': 0.6,
  't-bar-row': 0.55,
  ohp: 0.42,
  'skull-crusher': 0.28,
  'barbell-curl': 0.32,
  'hip-thrust': 1.0,
  // dumbbell (per hand)
  'incline-db-press': 0.22,
  'db-bench': 0.25,
  'decline-db-press': 0.22,
  'db-row': 0.28,
  'db-shoulder-press': 0.16,
  'arnold-press': 0.14,
  'lateral-raise': 0.07,
  'front-raise': 0.07,
  'rear-delt-fly': 0.06,
  shrug: 0.3,
  'hammer-curl': 0.14,
  'preacher-curl': 0.12,
  'concentration-curl': 0.12,
  'overhead-triceps': 0.16,
  'tricep-kickback': 0.08,
  'goblet-squat': 0.28,
  'walking-lunge': 0.18,
  'reverse-lunge': 0.18,
  'bulgarian-split': 0.16,
  'step-up': 0.18,
  'russian-twist': 0.1,
  'farmer-carry': 0.35,
  // cable + machine (stack)
  'lat-pulldown': 0.65,
  'seated-row': 0.6,
  'straight-arm-pulldown': 0.25,
  'cable-fly': 0.16,
  'pec-deck': 0.35,
  'face-pull': 0.2,
  'triceps-pushdown': 0.32,
  'cable-crunch': 0.35,
  'machine-chest-press': 0.55,
  'machine-shoulder-press': 0.35,
  'leg-press': 1.5,
  'leg-curl': 0.35,
  'leg-extension': 0.4,
  'calf-raise': 0.6,
  'seated-calf': 0.45,
  'hip-abduction': 0.35,
  'assisted-pull-up': 0.35,
  // kettlebell (per hand)
  'kettlebell-swing': 0.2,
  'kettlebell-deadlift': 0.3,
}

const EQUIPMENT_FALLBACK: Partial<Record<Exercise['equipment'], number>> = {
  barbell: 0.5,
  dumbbell: 0.15,
  cable: 0.35,
  machine: 0.5,
  kettlebell: 0.2,
}

const EXPERIENCE_FACTOR: Record<UserProfile['experience'], number> = {
  beginner: 0.72,
  intermediate: 1,
  advanced: 1.28,
}

const GOAL_FACTOR: Record<UserProfile['goal'], number> = {
  strength: 1.05,
  hypertrophy: 1,
  fat_loss: 0.9,
  endurance: 0.85,
}

const KETTLEBELLS = [8, 12, 16, 20, 24, 28, 32, 40]

/** Does this exercise take an external load at all? */
export function usesWeight(ex: Exercise): boolean {
  if (ex.kind === 'cardio') return false
  if (BODYWEIGHT_FRACTION[ex.id] != null) return true
  return EQUIPMENT_FALLBACK[ex.equipment] != null
}

function snap(value: number, step: number): number {
  return Math.round(value / step) * step
}

function roundToPlates(ex: Exercise, kg: number): number {
  switch (ex.equipment) {
    case 'barbell':
      return Math.max(20, snap(kg, 2.5))
    case 'kettlebell':
      return KETTLEBELLS.reduce((best, k) => (Math.abs(k - kg) < Math.abs(best - kg) ? k : best))
    case 'dumbbell':
      return Math.max(2, kg < 12 ? snap(kg, 1) : snap(kg, 2.5))
    default:
      return Math.max(5, snap(kg, 2.5))
  }
}

/**
 * Best guess at a first working weight when there is no history to progress
 * from. Returns undefined for bodyweight and cardio work.
 */
export function suggestStartWeight(
  ex: Exercise,
  profile: UserProfile,
  reps?: number,
): number | undefined {
  const fraction = BODYWEIGHT_FRACTION[ex.id] ?? EQUIPMENT_FALLBACK[ex.equipment]
  if (fraction == null) return undefined

  const bodyWeight = profile.bodyWeightKg > 0 ? profile.bodyWeightKg : 75
  const target = reps ?? ex.defaultReps ?? 10
  const repFactor = target >= 15 ? 0.85 : target <= 5 ? 1.15 : 1

  const raw =
    bodyWeight *
    fraction *
    EXPERIENCE_FACTOR[profile.experience] *
    GOAL_FACTOR[profile.goal] *
    repFactor

  return Math.min(300, roundToPlates(ex, raw))
}

/** Smallest load above `from` that the gym can actually give you. */
function nextIncrement(ex: Exercise, from: number): number {
  switch (ex.equipment) {
    case 'kettlebell':
      return KETTLEBELLS.find((k) => k > from) ?? from + 4
    case 'dumbbell':
      return from < 12 ? from + 1 : from + 2.5
    default:
      return from + 2.5
  }
}

/** Next-session target once a previous working weight is known. */
export function progressWeight(ex: Exercise, profile: UserProfile, previous: number): number {
  if (profile.goal !== 'strength' && profile.goal !== 'hypertrophy') {
    return Math.min(300, roundToPlates(ex, previous))
  }
  const gain = profile.goal === 'strength' ? 0.025 : 0.015
  const rounded = roundToPlates(ex, previous * (1 + gain))
  return Math.min(300, rounded > previous ? rounded : nextIncrement(ex, previous))
}
