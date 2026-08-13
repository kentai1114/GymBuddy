export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'full_body'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'treadmill'
  | 'none'

export type ExerciseKind = 'strength' | 'cardio' | 'timed'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Exercise {
  id: string
  name: string
  nameZh: string
  muscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  equipment: Equipment
  kind: ExerciseKind
  instructions: string[]
  youtubeId?: string
  defaultSets?: number
  defaultReps?: number
  defaultRestSec?: number
  defaultDurationSec?: number
  difficulty?: Difficulty
}

export interface PlannedSet {
  id: string
  targetReps?: number
  targetWeight?: number
  targetDurationSec?: number
  completed: boolean
  actualReps?: number
  actualWeight?: number
  actualDurationSec?: number
}

export interface PlannedExercise {
  id: string
  exerciseId: string
  kind: ExerciseKind
  sets: PlannedSet[]
  restSec: number
  notes?: string
}

export interface WorkoutSession {
  id: string
  date: string
  title: string
  focus: MuscleGroup[]
  goal: string
  estimatedMinutes: number
  actualMinutes?: number
  kcal?: number
  exercises: PlannedExercise[]
  startedAt?: string
  completedAt?: string
  status: 'planned' | 'in_progress' | 'completed' | 'skipped'
  source: 'ai' | 'manual' | 'template'
}

export interface UserProfile {
  name: string
  goal: 'strength' | 'hypertrophy' | 'fat_loss' | 'endurance'
  experience: 'beginner' | 'intermediate' | 'advanced'
  daysPerWeek: number
  preferredSplit: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'bro_split'
  bodyWeightKg: number
}

export interface SuggestInput {
  focus?: MuscleGroup[]
  minutes?: number
}

export interface AppState {
  profile: UserProfile
  sessions: WorkoutSession[]
  activeSessionId: string | null
}
