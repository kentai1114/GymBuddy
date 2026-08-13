import { useInsertionEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import { motionFor, type MotionId } from '@/lib/motion'
import {
  MOTIONS,
  RIG,
  gearPoint,
  handAt,
  limbAngles,
  spread,
  type Gear,
  type MotionDef,
  type Prop,
  type Side,
} from '@/lib/pose'

type NodeId = string

/**
 * A motion is shared by several exercises, so the drawn implement follows the
 * exercise's own equipment rather than the motion default.
 */
function effectiveGear(def: MotionDef, equipment?: string): Gear | undefined {
  if (equipment === 'bodyweight' || equipment === 'none' || equipment === 'treadmill') {
    return undefined
  }
  if (!def.gear) return undefined
  // One implement held at the hands' midpoint (Russian twist, etc.)
  if (def.gear === 'ball') return 'ball'
  switch (equipment) {
    case 'dumbbell':
      return 'dumbbell'
    case 'kettlebell':
      return 'kettlebell'
    case 'barbell':
      return 'barbell'
    case 'cable':
      return def.gear === 'latbar' ? 'latbar' : 'handle'
    default:
      return def.gear
  }
}

type Built = {
  css: string
  styleFor: (node: NodeId) => CSSProperties | undefined
}

const round = (n: number) => Math.round(n * 100) / 100

function transformsFor(def: MotionDef, gear: Gear | undefined): Record<NodeId, string[]> {
  const out: Record<NodeId, string[]> = {}
  const push = (node: NodeId, value: string) => {
    ;(out[node] ??= []).push(value)
  }

  for (const pose of def.poses) {
    const x = round(def.root[0] + (pose.dx ?? 0))
    const y = round(def.root[1] + (pose.dy ?? 0))
    push('root', `translate(${x}px, ${y}px) rotate(${round((def.rot ?? 0) + (pose.rot ?? 0))}deg)`)
    push('torso', `rotate(${round(pose.torso ?? 0)}deg)`)
    push('head', `rotate(${round(pose.head ?? 0)}deg)`)

    for (const side of ['far', 'near'] as Side[]) {
      const [au, al] = limbAngles(def, pose, 'arm', side)
      push(`arm-${side}-u`, `rotate(${round(au)}deg)`)
      push(`arm-${side}-l`, `rotate(${round(al)}deg)`)
      const [lu, ll] = limbAngles(def, pose, 'leg', side)
      push(`leg-${side}-u`, `rotate(${round(lu)}deg)`)
      push(`leg-${side}-l`, `rotate(${round(ll)}deg)`)
      const ankle = side === 'near' ? (pose.ank ?? 0) : (pose.ank2 ?? pose.ank ?? 0)
      push(`ank-${side}`, `rotate(${round(ankle)}deg)`)
    }

    const dualHands = gear === 'dumbbell' || (gear === 'handle' && def.view === 'front')
    if (dualHands) {
      for (const side of ['far', 'near'] as Side[]) {
        const [hx, hy] = handAt(def, pose, side)
        push(`gear-${side}`, `translate(${round(hx)}px, ${round(hy)}px)`)
      }
    } else if (gear) {
      const [gx, gy] = gearPoint(def, pose)
      push('gear', `translate(${round(gx)}px, ${round(gy)}px)`)
    }
    if (gear === 'handle' && def.view !== 'front' && def.props?.includes('cable-high')) {
      const [hx, hy] = handAt(def, pose, 'near')
      const dx = hx - 91
      const dy = hy - 14
      const len = Math.hypot(dx, dy)
      const ang = (-Math.atan2(dx, dy) * 180) / Math.PI
      push('cable-rope', `translate(91px, 14px) rotate(${round(ang)}deg) scaleY(${round(len)})`)
    }
  }

  return out
}

function buildMotion(motion: MotionId, gear: Gear | undefined): Built {
  const def = MOTIONS[motion]
  const table = transformsFor(def, gear)
  const statics: Record<NodeId, string> = {}
  const animated: Record<NodeId, string> = {}
  let css = ''

  for (const [node, frames] of Object.entries(table)) {
    const first = frames[0]
    if (frames.every((f) => f === first)) {
      statics[node] = first
      continue
    }
    const name = `xa-${motion}-${gear ?? 'bare'}-${node}`
    const steps = frames
      .map((f, i) => `${round((i / (frames.length - 1)) * 100)}%{transform:${f}}`)
      .join('')
    css += `@keyframes ${name}{${steps}}`
    statics[node] = first
    animated[node] = `${name} ${def.dur}s ease-in-out infinite alternate both`
  }

  return {
    css,
    styleFor: (node) => {
      if (animated[node]) return { animation: animated[node] }
      if (statics[node]) return { transform: statics[node] }
      return undefined
    },
  }
}

const injected = new Set<string>()
let sheet: HTMLStyleElement | null = null

function inject(key: string, css: string) {
  if (injected.has(key) || typeof document === 'undefined') return
  injected.add(key)
  if (!sheet) {
    sheet = document.createElement('style')
    sheet.setAttribute('data-ex-anim', '')
    document.head.appendChild(sheet)
  }
  sheet.textContent = `${sheet.textContent ?? ''}${css}`
}

/** Filled muscle capsule: thick in the belly, tapering into the joints. */
function Muscle({
  len,
  top,
  mid,
  bot,
  shade = false,
}: {
  len: number
  top: number
  mid: number
  bot: number
  shade?: boolean
}) {
  const d = [
    `M ${-top} 0`,
    `C ${-top} ${round(len * 0.12)}, ${-mid} ${round(len * 0.26)}, ${-mid} ${round(len * 0.42)}`,
    `C ${-mid} ${round(len * 0.68)}, ${-bot} ${round(len * 0.86)}, ${-bot} ${len}`,
    `L ${bot} ${len}`,
    `C ${bot} ${round(len * 0.86)}, ${mid} ${round(len * 0.68)}, ${mid} ${round(len * 0.42)}`,
    `C ${mid} ${round(len * 0.26)}, ${top} ${round(len * 0.12)}, ${top} 0`,
    'Z',
  ].join(' ')
  return <path className={shade ? 'muscle shade' : 'muscle'} d={d} />
}

function Limb({
  def,
  kind,
  side,
  styleFor,
}: {
  def: MotionDef
  kind: 'arm' | 'leg'
  side: Side
  styleFor: Built['styleFor']
}) {
  const upper = kind === 'arm' ? RIG.upperArm : RIG.thigh
  const lower = kind === 'arm' ? RIG.foreArm : RIG.shin
  const originY = kind === 'arm' ? RIG.shoulderY : 0
  return (
    <g transform={`translate(${spread(def, kind, side)}, ${originY})`}>
      {kind === 'arm' && <ellipse className="muscle delt" cx={0} cy={1.2} rx={4.6} ry={4.3} />}
      <g style={styleFor(`${kind}-${side}-u`)}>
        {kind === 'arm' ? (
          <Muscle len={upper} top={3.2} mid={4.8} bot={2.8} />
        ) : (
          <Muscle len={upper} top={4.6} mid={6.1} bot={3.6} />
        )}
        <circle className="muscle joint" cy={upper} r={kind === 'arm' ? 2.1 : 2.5} />
        <g transform={`translate(0, ${upper})`}>
          <g style={styleFor(`${kind}-${side}-l`)}>
            {kind === 'arm' ? (
              <Muscle len={lower} top={2.7} mid={3.3} bot={2.1} />
            ) : (
              <Muscle len={lower} top={3.4} mid={4.4} bot={2.4} />
            )}
            <g transform={`translate(0, ${lower})`}>
              {kind === 'leg' ? (
                <g style={styleFor(`ank-${side}`)}>
                  <path
                    className="muscle foot"
                    d={`M -1.4 0 L ${RIG.foot} 0.6 L ${RIG.foot - 0.4} 3.2 L -2 2.4 Z`}
                  />
                </g>
              ) : (
                <ellipse className="muscle fist" cx={0} cy={1.8} rx={2.3} ry={2.7} />
              )}
            </g>
          </g>
        </g>
      </g>
    </g>
  )
}

function Dummy({
  def,
  styleFor,
}: {
  def: MotionDef
  styleFor: Built['styleFor']
}) {
  const front = def.view === 'front'
  const torso = front
    ? `M -6.4 2.4 C -8.2 -2, -10.6 -9, -12.8 -18.2 C -13.4 -20.6, -10.2 -22.4, -6.8 -22.8 L 0 -24.2 L 6.8 -22.8 C 10.2 -22.4, 13.4 -20.6, 12.8 -18.2 C 10.6 -9, 8.2 -2, 6.4 2.4 C 3.6 4.4, -3.6 4.4, -6.4 2.4 Z`
    : `M -4.2 2.6 C -5.4 -4, -6.2 -12, -5.8 -20.4 C -5.4 -23, -2.2 -24.4, 0.6 -24.2 C 4.2 -23.8, 5.8 -20, 5.4 -12 C 5 -5, 4.4 1.4, 3.2 3 C 0.6 4.6, -2.4 4.4, -4.2 2.6 Z`

  return (
    <g className="fig dummy" style={styleFor('root')}>
      <g className="limb far">
        <Limb def={def} kind="leg" side="far" styleFor={styleFor} />
      </g>
      <ellipse className="muscle hips" cx={0} cy={1.4} rx={front ? 7.2 : 5.2} ry={3.4} />
      <g className="limb near">
        <Limb def={def} kind="leg" side="near" styleFor={styleFor} />
      </g>
      <g style={styleFor('torso')}>
        <g className="limb far">
          <Limb def={def} kind="arm" side="far" styleFor={styleFor} />
        </g>
        <path className="muscle torso" d={torso} />
        {front && (
          <g className="abs">
            <ellipse className="muscle shade pec" cx={-4.4} cy={-15.2} rx={4.8} ry={3.4} />
            <ellipse className="muscle shade pec" cx={4.4} cy={-15.2} rx={4.8} ry={3.4} />
            <rect className="muscle shade ab" x={-2.6} y={-10.4} width={2.3} height={2.1} rx={0.6} />
            <rect className="muscle shade ab" x={0.3} y={-10.4} width={2.3} height={2.1} rx={0.6} />
            <rect className="muscle shade ab" x={-2.6} y={-7.6} width={2.3} height={2.1} rx={0.6} />
            <rect className="muscle shade ab" x={0.3} y={-7.6} width={2.3} height={2.1} rx={0.6} />
            <rect className="muscle shade ab" x={-2.4} y={-4.8} width={2.1} height={1.9} rx={0.55} />
            <rect className="muscle shade ab" x={0.3} y={-4.8} width={2.1} height={1.9} rx={0.55} />
          </g>
        )}
        {!front && <ellipse className="muscle shade pec" cx={1.4} cy={-15} rx={3.6} ry={3.2} />}
        <g transform={`translate(0, ${RIG.torso * -1})`}>
          <rect className="muscle neck" x={-2.1} y={-2.8} width={4.2} height={5.2} rx={1.6} />
          <g style={styleFor('head')}>
            <ellipse className="muscle head" cx={0} cy={-RIG.headGap} rx={RIG.headR} ry={RIG.headR + 0.6} />
            <ellipse
              className="muscle shade"
              cx={front ? 0 : 2.2}
              cy={-RIG.headGap - 0.4}
              rx={front ? 3.2 : 2.4}
              ry={2.2}
            />
          </g>
        </g>
        <g className="limb near">
          <Limb def={def} kind="arm" side="near" styleFor={styleFor} />
        </g>
      </g>
    </g>
  )
}

function Gear({
  def,
  gear,
  styleFor,
}: {
  def: MotionDef
  gear: Gear | undefined
  styleFor: Built['styleFor']
}) {
  if (!gear) return null
  const front = def.view === 'front'

  if (gear === 'dumbbell' || (gear === 'handle' && front)) {
    return (
      <>
        {(['far', 'near'] as Side[]).map((side) => (
          <g key={side} className={`gear gear-${side}`} style={styleFor(`gear-${side}`)}>
            {gear === 'dumbbell' ? (
              <>
                <line x1={-4} x2={4} />
                <rect x={-6.4} y={-3.4} width={2.9} height={6.8} rx={1} />
                <rect x={3.5} y={-3.4} width={2.9} height={6.8} rx={1} />
              </>
            ) : (
              <rect x={-2.2} y={-2.8} width={4.4} height={5.6} rx={1.4} />
            )}
          </g>
        ))}
      </>
    )
  }

  return (
    <g className="gear" style={styleFor('gear')}>
      {gear === 'barbell' && front && (
        <>
          <line x1={-21} x2={21} />
          <rect x={-20} y={-4.6} width={3.2} height={9.2} rx={1.2} />
          <rect x={16.8} y={-4.6} width={3.2} height={9.2} rx={1.2} />
        </>
      )}
      {gear === 'barbell' && !front && (
        <>
          <line x1={-9} x2={9} />
          <circle r={4.8} className="plate" />
        </>
      )}
      {gear === 'latbar' && (
        <>
          <line x1={-15} x2={15} />
          <line x1={-15} y1={-2.6} x2={-15} y2={2.6} />
          <line x1={15} y1={-2.6} x2={15} y2={2.6} />
        </>
      )}
      {gear === 'kettlebell' && (
        <>
          <path d="M -3 1 A 3 3 0 0 1 3 1" />
          <circle cy={5} r={4.4} className="plate" />
        </>
      )}
      {gear === 'handle' && <rect x={-2.2} y={-2.8} width={4.4} height={5.6} rx={1.4} />}
      {gear === 'ball' && <circle r={4.6} className="plate" />}
    </g>
  )
}

function Props({ def }: { def: MotionDef }) {
  const list = def.props ?? []
  const barY = round(handAt(def, def.poses[0], 'near')[1])
  const nodes: ReactNode[] = []

  for (const prop of list as Prop[]) {
    switch (prop) {
      case 'floor':
        nodes.push(<line key={prop} className="floor" x1={6} y1={90} x2={94} y2={90} />)
        break
      case 'bench':
        nodes.push(
          <g key={prop} className="prop">
            <rect x={12} y={58} width={50} height={4.4} rx={2.2} className="pad" />
            <line x1={18} y1={62} x2={18} y2={90} />
            <line x1={57} y1={62} x2={57} y2={90} />
          </g>,
        )
        break
      case 'bench-back':
        nodes.push(
          <g key={prop} className="prop">
            <rect x={6} y={76} width={30} height={4.4} rx={2.2} className="pad" />
            <line x1={12} y1={80} x2={12} y2={90} />
          </g>,
        )
        break
      case 'seat':
        nodes.push(
          <g key={prop} className="prop">
            <rect x={38} y={54} width={26} height={4.4} rx={2.2} className="pad" />
            <line x1={50} y1={58} x2={50} y2={90} />
            <line x1={40} y1={90} x2={62} y2={90} />
          </g>,
        )
        break
      case 'seat-back':
        nodes.push(
          <g key={prop} className="prop">
            <rect x={34} y={78} width={28} height={4.4} rx={2.2} className="pad" />
            <rect x={30} y={52} width={4.4} height={28} rx={2.2} className="pad" />
            <line x1={46} y1={82} x2={46} y2={90} />
            <line x1={34} y1={90} x2={62} y2={90} />
          </g>,
        )
        break
      case 'bar-overhead':
        nodes.push(
          <g key={prop} className="prop">
            <line x1={24} y1={barY} x2={76} y2={barY} className="bar" />
            <line x1={28} y1={barY} x2={28} y2={6} />
            <line x1={72} y1={barY} x2={72} y2={6} />
          </g>,
        )
        break
      case 'cable-high':
        nodes.push(
          <g key={prop} className="prop">
            <line x1={91} y1={14} x2={91} y2={90} />
            <circle cx={91} cy={14} r={3} />
          </g>,
        )
        break
      case 'cable-pair':
        nodes.push(
          <g key={prop} className="prop">
            <line x1={91} y1={26} x2={91} y2={90} />
            <circle cx={91} cy={26} r={3} />
            <line x1={9} y1={26} x2={9} y2={90} />
            <circle cx={9} cy={26} r={3} />
          </g>,
        )
        break
      case 'cable-low':
        nodes.push(
          <g key={prop} className="prop">
            <line x1={91} y1={40} x2={91} y2={90} />
            <circle cx={91} cy={84} r={3} />
          </g>,
        )
        break
      case 'wall':
        nodes.push(<line key={prop} className="prop wall" x1={39} y1={20} x2={39} y2={90} />)
        break
      case 'box':
        nodes.push(
          <g key={prop} className="prop">
            <rect className="pad" x={57} y={73} width={29} height={17} rx={2} />
          </g>,
        )
        break
      case 'dip-bars':
        nodes.push(
          <g key={prop} className="prop">
            <line x1={30} y1={57} x2={90} y2={57} className="bar" />
            <line x1={84} y1={57} x2={84} y2={90} />
          </g>,
        )
        break
      case 'treadmill':
        nodes.push(
          <g key={prop} className="prop">
            <rect x={10} y={89} width={80} height={6} rx={3} className="pad" />
            <line x1={86} y1={89} x2={90} y2={56} />
            <line x1={84} y1={56} x2={94} y2={56} className="bar" />
          </g>,
        )
        break
      case 'bike':
        nodes.push(
          <g key={prop} className="prop">
            <circle cx={62} cy={82} r={7.5} />
            <rect x={42} y={66} width={18} height={4} rx={2} className="pad" />
            <line x1={51} y1={70} x2={51} y2={86} />
            <line x1={51} y1={86} x2={84} y2={86} />
            <line x1={84} y1={86} x2={84} y2={46} />
            <line x1={78} y1={46} x2={90} y2={46} className="bar" />
          </g>,
        )
        break
      case 'rail':
        nodes.push(
          <g key={prop} className="prop">
            <line x1={28} y1={72} x2={94} y2={72} className="bar" />
            <rect x={82} y={56} width={9} height={14} rx={2} className="pad" />
          </g>,
        )
        break
      case 'rope':
        nodes.push(<ellipse key={prop} className="rope" cx={50} cy={62} rx={27} ry={31} />)
        break
    }
  }

  return <>{nodes}</>
}

export function ExerciseAnim({
  exerciseId,
  kind,
  muscle,
  equipment,
  size = 'thumb',
}: {
  exerciseId: string
  kind?: string
  muscle?: string
  equipment?: string
  size?: 'thumb' | 'wide' | 'hero'
}) {
  const motion: MotionId = motionFor(exerciseId, kind, muscle)
  const def = MOTIONS[motion]
  const gear = effectiveGear(def, equipment)
  const built = useMemo(() => buildMotion(motion, gear), [motion, gear])

  useInsertionEffect(() => {
    inject(`${motion}-${gear ?? 'bare'}`, built.css)
  }, [motion, gear, built])

  const { styleFor } = built

  return (
    <div className={`ex-anim size-${size}`} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <Props def={def} />
        {gear === 'handle' && def.view !== 'front' && def.props?.includes('cable-high') && (
          <g className="prop" style={styleFor('cable-rope')}>
            <line x1={0} y1={0} x2={0} y2={1} />
          </g>
        )}
        <Dummy def={def} styleFor={styleFor} />
        <Gear def={def} gear={gear} styleFor={styleFor} />
      </svg>
    </div>
  )
}
