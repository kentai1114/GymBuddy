import type { MotionId } from './motion'

/**
 * Muscular dummy rig used by ExerciseAnim.
 *
 * Angles are degrees, clockwise (SVG). Bones point straight down at 0, the
 * torso points straight up at 0. Limb angles are relative to their parent
 * bone, so the SVG nesting does the forward kinematics for us.
 */

export const RIG = {
  torso: 24,
  shoulderY: -20,
  headGap: 6.5,
  headR: 5.5,
  upperArm: 13,
  foreArm: 12,
  thigh: 17,
  shin: 17,
  foot: 6,
  shoulderSpread: 7,
  hipSpread: 4,
  ground: 90,
} as const

export type Pose = {
  dx?: number
  dy?: number
  rot?: number
  torso?: number
  head?: number
  /** near limb: [upper, lower] */
  arm?: [number, number]
  /** far limb; defaults to the near limb (mirrored in front view) */
  arm2?: [number, number]
  leg?: [number, number]
  leg2?: [number, number]
  ank?: number
  ank2?: number
}

export type Gear = 'barbell' | 'dumbbell' | 'kettlebell' | 'handle' | 'latbar' | 'ball'
export type Prop =
  | 'floor'
  | 'bench'
  | 'bench-back'
  | 'incline-bench'
  | 'seat'
  | 'seat-back'
  | 'bar-overhead'
  | 'cable-high'
  | 'cable-pair'
  | 'cable-low'
  | 'wall'
  | 'box'
  | 'dip-bars'
  | 'treadmill'
  | 'bike'
  | 'rail'
  | 'rope'

export type MotionDef = {
  /** front view splits shoulders/hips apart and mirrors the far limbs */
  view?: 'front'
  dur: number
  /** pelvis anchor */
  root: [number, number]
  rot?: number
  gear?: Gear
  /** where the gear sits: hands (default), traps, hips */
  gearAt?: 'hands' | 'traps' | 'hips'
  props?: Prop[]
  poses: Pose[]
}

export const MOTIONS: Record<MotionId, MotionDef> = {
  press: {
    dur: 1.55,
    root: [44, 60],
    rot: -90,
    gear: 'barbell',
    props: ['floor', 'bench'],
    poses: [
      { arm: [-88, -6], leg: [42, 78], leg2: [38, 82], ank: -18 },
      { arm: [22, -136], leg: [42, 78], leg2: [38, 82], ank: -18 },
    ],
  },
  inclinepress: {
    dur: 1.55,
    root: [50, 66],
    rot: -52,
    gear: 'dumbbell',
    props: ['floor', 'incline-bench'],
    poses: [
      { arm: [-86, -10], leg: [28, 72], leg2: [24, 76], ank: -14 },
      { arm: [16, -128], leg: [28, 72], leg2: [24, 76], ank: -14 },
    ],
  },
  chestpress: {
    dur: 1.5,
    root: [50, 64],
    gear: 'handle',
    props: ['floor', 'seat-back'],
    poses: [
      { torso: -12, arm: [-32, -108], leg: [-82, 88], leg2: [-78, 84] },
      { torso: -8, arm: [-88, -8], leg: [-82, 88], leg2: [-78, 84] },
    ],
  },
  fly: {
    view: 'front',
    dur: 1.7,
    root: [50, 56],
    gear: 'handle',
    props: ['floor', 'cable-pair'],
    poses: [
      { arm: [-95, -14], leg: [4, 0] },
      { arm: [-60, 120], leg: [4, 0] },
    ],
  },
  pushup: {
    dur: 1.5,
    root: [46, 72],
    rot: 70,
    props: ['floor'],
    poses: [
      { arm: [-70, 0], leg: [0, 0], ank: -50 },
      { dy: 7, arm: [-28, -71], leg: [0, 0], ank: -50 },
    ],
  },
  dip: {
    dur: 1.6,
    root: [50, 53],
    props: ['dip-bars'],
    poses: [
      { torso: 14, arm: [11.3, -38.8], leg: [-18, 66], leg2: [-14, 62] },
      { dy: 13, torso: 18, arm: [64.5, -128.8], leg: [-24, 78], leg2: [-20, 74] },
    ],
  },
  pullup: {
    view: 'front',
    dur: 1.8,
    root: [50, 64],
    props: ['bar-overhead'],
    poses: [
      { arm: [-165, 0], leg: [3, 0] },
      { dy: -16, arm: [-81, -131], leg: [3, 0] },
    ],
  },
  pulldown: {
    view: 'front',
    dur: 1.6,
    root: [50, 52],
    gear: 'latbar',
    props: ['seat', 'cable-high'],
    poses: [
      { arm: [-140, -10], leg: [5, 0] },
      { arm: [20, -115], leg: [5, 0] },
    ],
  },
  row: {
    dur: 1.5,
    root: [50, 56],
    gear: 'barbell',
    props: ['floor'],
    poses: [
      { torso: 60, arm: [-60, 0], leg: [-12, 18] },
      { torso: 58, arm: [24, -112], leg: [-12, 18] },
    ],
  },
  ohp: {
    view: 'front',
    dur: 1.6,
    root: [50, 56],
    gear: 'dumbbell',
    props: ['floor'],
    poses: [
      { arm: [-70, -115], leg: [4, 0] },
      { arm: [-172, 0], leg: [4, 0] },
    ],
  },
  raise: {
    view: 'front',
    dur: 1.5,
    root: [50, 56],
    gear: 'dumbbell',
    props: ['floor'],
    poses: [
      { arm: [-8, -8], leg: [4, 0] },
      { arm: [-92, -10], leg: [4, 0] },
    ],
  },
  curl: {
    view: 'front',
    dur: 1.4,
    root: [50, 56],
    gear: 'dumbbell',
    props: ['floor'],
    poses: [
      { arm: [-6, -6], leg: [4, 0] },
      { arm: [-16, -138], leg: [4, 0] },
    ],
  },
  extension: {
    view: 'front',
    dur: 1.3,
    root: [50, 56],
    gear: 'latbar',
    props: ['floor', 'cable-high'],
    poses: [
      { arm: [-6, -100], leg: [4, 0], torso: 4 },
      { arm: [-6, -6], leg: [4, 0], torso: 4 },
    ],
  },
  squat: {
    dur: 1.7,
    root: [50, 56],
    gear: 'barbell',
    gearAt: 'traps',
    props: ['floor'],
    poses: [
      { torso: 8, leg: [0, 0], leg2: [7, -7], arm: [20, -160] },
      { dx: -10, dy: 18, torso: 30, leg: [-88.2, 112.5], leg2: [-84, 108], arm: [20, -160] },
    ],
  },
  hinge: {
    dur: 1.7,
    root: [50, 56],
    gear: 'barbell',
    props: ['floor'],
    poses: [
      { torso: 5, leg: [0, 0], leg2: [5, -5], arm: [-5, 0] },
      { torso: 70, leg: [-8, 12], leg2: [-4, 8], arm: [-70, 0] },
    ],
  },
  lunge: {
    dur: 1.6,
    root: [50, 56],
    gear: 'dumbbell',
    props: ['floor'],
    poses: [
      { dy: -2, torso: 6, leg: [-20, 20], leg2: [10, 10], arm: [-6, 0] },
      { dy: 6, torso: 8, leg: [-50, 50], leg2: [15, 32], arm: [-6, 0] },
    ],
  },
  hipthrust: {
    dur: 1.6,
    root: [42, 86],
    gear: 'barbell',
    gearAt: 'hips',
    props: ['floor', 'bench-back'],
    poses: [
      { torso: -53, leg: [-124.8, 88.6], leg2: [-120, 86], arm: [153, 0] },
      { dx: 4, dy: -12, torso: -90, leg: [-92.5, 82.3], leg2: [-88, 80], arm: [190, 0] },
    ],
  },
  calf: {
    dur: 1.1,
    root: [50, 56],
    gear: 'dumbbell',
    props: ['floor'],
    poses: [
      { leg: [0, 0], leg2: [4, -4], arm: [-8, -6], arm2: [7, 5], ank: 0, ank2: 0 },
      { dy: -6, leg: [0, 0], leg2: [4, -4], arm: [-8, -6], arm2: [7, 5], ank: -38, ank2: -38 },
    ],
  },
  plank: {
    dur: 2.4,
    root: [47, 81],
    rot: 78,
    props: ['floor'],
    poses: [
      { arm: [-78, -90], leg: [0, 0], ank: -55 },
      { dy: 1.5, arm: [-78, -90], leg: [0, 0], ank: -55 },
    ],
  },
  sideplank: {
    dur: 2.4,
    root: [50, 73],
    rot: 65,
    props: ['floor'],
    poses: [
      { arm: [-60, 0], arm2: [115, 0], leg: [0, 0] },
      { dy: 1.5, arm: [-60, 0], arm2: [115, 0], leg: [0, 0] },
    ],
  },
  wallsit: {
    dur: 2.2,
    root: [46, 73],
    props: ['floor', 'wall'],
    poses: [
      { leg: [-90, 90], arm: [-88, 0] },
      { dy: 1.2, leg: [-90, 90], arm: [-88, 0] },
    ],
  },
  legraise: {
    dur: 1.8,
    root: [50, 58],
    props: ['bar-overhead'],
    poses: [
      { arm: [180, 0], leg: [0, 0] },
      { arm: [180, 0], leg: [-92, 4] },
    ],
  },
  crunch: {
    dur: 1.5,
    root: [46, 84],
    rot: -90,
    props: ['floor'],
    poses: [
      { torso: 0, leg: [-45, 155], arm: [-118, -60] },
      { torso: 26, leg: [-45, 155], arm: [-118, -60] },
    ],
  },
  /** Kneeling rope crunch — not the lying floor crunch. */
  cablecrunch: {
    dur: 1.55,
    root: [52, 74],
    gear: 'handle',
    props: ['floor', 'cable-high'],
    poses: [
      { torso: -8, head: -6, leg: [-28, 118], arm: [140, 130], ank: 18 },
      { torso: 34, head: 10, leg: [-24, 114], arm: [140, 130], ank: 18 },
    ],
  },
  twist: {
    view: 'front',
    dur: 1.35,
    root: [50, 72],
    gear: 'ball',
    props: ['floor'],
    poses: [
      { torso: -22, head: -10, leg: [-70, 125], arm: [8, -170] },
      { torso: 22, head: 10, leg: [-70, 125], arm: [8, -170] },
    ],
  },
  deadbug: {
    dur: 1.8,
    root: [46, 84],
    rot: -90,
    props: ['floor'],
    poses: [
      { arm: [-90, 0], arm2: [-90, 0], leg: [-45, 155], leg2: [-45, 155] },
      { arm: [-90, 0], arm2: [180, 0], leg: [-45, 155], leg2: [0, 0] },
    ],
  },
  birddog: {
    dur: 1.8,
    root: [48, 73],
    rot: 66,
    props: ['floor'],
    poses: [
      { arm: [-66, 0], arm2: [-66, 0], leg: [-66, 90], leg2: [-66, 90] },
      { arm: [-66, 0], arm2: [-136, 0], leg: [-66, 90], leg2: [-46, 0] },
    ],
  },
  carry: {
    dur: 0.8,
    root: [50, 56],
    gear: 'dumbbell',
    props: ['floor'],
    poses: [
      { leg: [-18, 10], leg2: [16, 25], arm: [0, 0], arm2: [0, 0] },
      { leg: [16, 25], leg2: [-18, 10], arm: [0, 0], arm2: [0, 0] },
    ],
  },
  run: {
    dur: 0.42,
    root: [50, 54],
    props: ['treadmill'],
    poses: [
      { torso: 8, leg: [-40, 55], leg2: [28, 78], arm: [-38, -72], arm2: [34, -72], ank: -20 },
      { torso: 8, leg: [28, 78], leg2: [-40, 55], arm: [34, -72], arm2: [-38, -72], ank: -20 },
    ],
  },
  bike: {
    dur: 0.6,
    root: [50, 64],
    props: ['bike'],
    poses: [
      { torso: 26, leg: [-86, 77.4], leg2: [-70.8, 113.7], arm: [-114, -6] },
      { torso: 26, leg: [-70.8, 113.7], leg2: [-86, 77.4], arm: [-114, -6] },
    ],
  },
  rower: {
    dur: 1.6,
    root: [58, 66],
    props: ['rail'],
    poses: [
      { torso: 34, leg: [-134.2, 79.6], leg2: [-130, 76], arm: [-107, 0] },
      { dx: -6, torso: -18, leg: [-112.9, 38.6], leg2: [-109, 36], arm: [12.4, -108.4] },
    ],
  },
  swing: {
    dur: 1.1,
    root: [50, 56],
    gear: 'kettlebell',
    props: ['floor'],
    poses: [
      { dy: 4, torso: 62, leg: [-16, 22], arm: [-42, 0] },
      { torso: -4, leg: [0, 0], arm: [-92, 0] },
    ],
  },
  jumprope: {
    view: 'front',
    dur: 0.5,
    root: [50, 56],
    props: ['floor', 'rope'],
    poses: [
      { leg: [3, 4], arm: [14, -46], ank: -20 },
      { dy: -9, leg: [5, 26], arm: [10, -40], ank: -45 },
    ],
  },
  climber: {
    dur: 0.55,
    root: [46, 72],
    rot: 70,
    props: ['floor'],
    poses: [
      { arm: [-70, 0], leg: [0, 0], leg2: [-100, 62], ank: -50 },
      { arm: [-70, 0], leg: [-100, 62], leg2: [0, 0], ank: -20 },
    ],
  },
  burpee: {
    dur: 0.75,
    root: [50, 56],
    props: ['floor'],
    poses: [
      { dy: -10, torso: 0, leg: [4, 0], arm: [-176, 0], ank: -30 },
      { dy: 16, torso: 34, leg: [-58, 104], arm: [-40, -20] },
      { dx: 4, dy: 16, rot: 66, torso: 4, leg: [-4, 0], arm: [-66, 0], ank: -50 },
    ],
  },
  shrug: {
    view: 'front',
    dur: 1.2,
    root: [50, 56],
    gear: 'dumbbell',
    props: ['floor'],
    poses: [
      { leg: [4, 0], arm: [-5, 0], head: 0 },
      { dy: -4, leg: [4, 0], arm: [-2, 0], head: 0 },
    ],
  },
  stepup: {
    dur: 1.6,
    root: [50, 56],
    gear: 'dumbbell',
    props: ['floor', 'box'],
    poses: [
      { torso: 10, leg: [-90.1, 93.5], leg2: [6, 6], arm: [-6, 0] },
      { dx: 16, dy: -17, torso: 4, leg: [0, 0], leg2: [22, 48], arm: [-6, 0] },
    ],
  },
  kick: {
    dur: 1.3,
    root: [46, 66],
    props: ['seat-back'],
    poses: [
      { torso: -6, leg: [-90, 88], leg2: [-90, 84], arm: [-70, -30] },
      { torso: -6, leg: [-90, 4], leg2: [-90, 8], arm: [-70, -30] },
    ],
  },
  hollow: {
    dur: 2.2,
    root: [46, 84],
    rot: -90,
    props: ['floor'],
    poses: [
      { torso: 18, leg: [-26, 0], arm: [-102, 0] },
      { torso: 22, leg: [-22, 0], arm: [-104, 0] },
    ],
  },
}

const RAD = Math.PI / 180

function rot(angle: number, x: number, y: number): [number, number] {
  const c = Math.cos(angle * RAD)
  const s = Math.sin(angle * RAD)
  return [x * c - y * s, x * s + y * c]
}

function add(p: [number, number], d: [number, number]): [number, number] {
  return [p[0] + d[0], p[1] + d[1]]
}

export type Side = 'near' | 'far'

export function limbAngles(
  def: MotionDef,
  pose: Pose,
  part: 'arm' | 'leg',
  side: Side,
): [number, number] {
  const near = pose[part] ?? [0, 0]
  if (side === 'near') return near
  const far = pose[part === 'arm' ? 'arm2' : 'leg2']
  if (far) return far
  return def.view === 'front' ? [-near[0], -near[1]] : near
}

export function spread(def: MotionDef, part: 'arm' | 'leg', side: Side): number {
  if (def.view !== 'front') return 0
  const base = part === 'arm' ? RIG.shoulderSpread : RIG.hipSpread
  return side === 'near' ? base : -base
}

/** Absolute hand position for a pose, used to hang gear off the figure. */
export function handAt(def: MotionDef, pose: Pose, side: Side): [number, number] {
  const rootAngle = (def.rot ?? 0) + (pose.rot ?? 0)
  const pelvis: [number, number] = [
    def.root[0] + (pose.dx ?? 0),
    def.root[1] + (pose.dy ?? 0),
  ]
  const torsoAngle = rootAngle + (pose.torso ?? 0)
  const shoulder = add(pelvis, rot(torsoAngle, spread(def, 'arm', side), RIG.shoulderY))
  const [upper, fore] = limbAngles(def, pose, 'arm', side)
  const elbow = add(shoulder, rot(torsoAngle + upper, 0, RIG.upperArm))
  return add(elbow, rot(torsoAngle + upper + fore, 0, RIG.foreArm))
}

/** Absolute pelvis / neck positions, used for bar-on-back and bar-on-hips gear. */
export function anchorAt(def: MotionDef, pose: Pose, at: 'traps' | 'hips'): [number, number] {
  const rootAngle = (def.rot ?? 0) + (pose.rot ?? 0)
  const pelvis: [number, number] = [
    def.root[0] + (pose.dx ?? 0),
    def.root[1] + (pose.dy ?? 0),
  ]
  if (at === 'hips') return pelvis
  return add(pelvis, rot(rootAngle + (pose.torso ?? 0), 0, RIG.shoulderY - 2))
}

export function gearPoint(def: MotionDef, pose: Pose): [number, number] {
  if (def.gearAt === 'traps' || def.gearAt === 'hips') return anchorAt(def, pose, def.gearAt)
  const near = handAt(def, pose, 'near')
  if (def.view !== 'front') return near
  const far = handAt(def, pose, 'far')
  return [(near[0] + far[0]) / 2, (near[1] + far[1]) / 2]
}
