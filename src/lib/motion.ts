export type MotionId =
  | 'press'
  | 'inclinepress'
  | 'chestpress'
  | 'fly'
  | 'pushup'
  | 'dip'
  | 'pullup'
  | 'pulldown'
  | 'row'
  | 'ohp'
  | 'raise'
  | 'curl'
  | 'extension'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'hipthrust'
  | 'calf'
  | 'plank'
  | 'sideplank'
  | 'wallsit'
  | 'legraise'
  | 'crunch'
  | 'cablecrunch'
  | 'twist'
  | 'deadbug'
  | 'birddog'
  | 'carry'
  | 'run'
  | 'bike'
  | 'rower'
  | 'swing'
  | 'jumprope'
  | 'climber'
  | 'burpee'
  | 'shrug'
  | 'stepup'
  | 'kick'
  | 'hollow'

const MOTION_BY_ID: Record<string, MotionId> = {
  'bench-press': 'press',
  'incline-db-press': 'inclinepress',
  'db-bench': 'press',
  'machine-chest-press': 'chestpress',
  'decline-db-press': 'press',
  'close-grip-bench': 'press',
  'cable-fly': 'fly',
  'pec-deck': 'fly',
  'rear-delt-fly': 'fly',
  'push-up': 'pushup',
  'knee-push-up': 'pushup',
  'chest-dip': 'dip',
  'pull-up': 'pullup',
  'chin-up': 'pullup',
  'assisted-pull-up': 'pullup',
  'lat-pulldown': 'pulldown',
  'straight-arm-pulldown': 'pulldown',
  'barbell-row': 'row',
  'seated-row': 'row',
  'inverted-row': 'row',
  'db-row': 'row',
  't-bar-row': 'row',
  'ohp': 'ohp',
  'db-shoulder-press': 'ohp',
  'machine-shoulder-press': 'ohp',
  'arnold-press': 'ohp',
  'lateral-raise': 'raise',
  'front-raise': 'raise',
  'face-pull': 'raise',
  'barbell-curl': 'curl',
  'hammer-curl': 'curl',
  'preacher-curl': 'curl',
  'concentration-curl': 'curl',
  'triceps-pushdown': 'extension',
  'skull-crusher': 'extension',
  'overhead-triceps': 'extension',
  'tricep-kickback': 'extension',
  'squat': 'squat',
  'goblet-squat': 'squat',
  'box-squat': 'squat',
  'front-squat': 'squat',
  'leg-press': 'squat',
  'rdl': 'hinge',
  'deadlift': 'hinge',
  'kettlebell-deadlift': 'hinge',
  'good-morning': 'hinge',
  'walking-lunge': 'lunge',
  'reverse-lunge': 'lunge',
  'bulgarian-split': 'lunge',
  'hip-thrust': 'hipthrust',
  'glute-bridge': 'hipthrust',
  'calf-raise': 'calf',
  'seated-calf': 'calf',
  'plank': 'plank',
  'incline-plank': 'plank',
  'side-plank': 'sideplank',
  'wall-sit': 'wallsit',
  'hanging-leg-raise': 'legraise',
  'lying-leg-raise': 'legraise',
  'cable-crunch': 'cablecrunch',
  'crunch': 'crunch',
  'bicycle-crunch': 'crunch',
  'russian-twist': 'twist',
  'dead-bug': 'deadbug',
  'bird-dog': 'birddog',
  'farmer-carry': 'carry',
  'treadmill-run-5': 'run',
  'treadmill-run-10': 'run',
  'incline-walk': 'run',
  'bike-intervals': 'bike',
  'elliptical': 'bike',
  'rower': 'rower',
  'kettlebell-swing': 'swing',
  'jump-rope': 'jumprope',
  'mountain-climber': 'climber',
  'burpee': 'burpee',
  'shrug': 'shrug',
  'step-up': 'stepup',
  'hip-abduction': 'kick',
  'leg-curl': 'kick',
  'leg-extension': 'kick',
  'hollow-hold': 'hollow',
}

export function motionFor(exerciseId: string, kind?: string, muscle?: string): MotionId {
  const mapped = MOTION_BY_ID[exerciseId]
  if (mapped) return mapped
  if (kind === 'timed') return muscle === 'legs' ? 'wallsit' : 'plank'
  if (kind === 'cardio') return 'run'
  if (muscle === 'chest') return 'press'
  if (muscle === 'back') return 'row'
  if (muscle === 'shoulders') return 'ohp'
  if (muscle === 'arms') return 'curl'
  if (muscle === 'legs') return 'squat'
  if (muscle === 'core') return 'crunch'
  return 'squat'
}
