import { Plus } from 'lucide-react'
import type { PlannedExercise, PlannedSet } from '@/lib/types'

export function SetsTable({
  pe,
  highlightSetId,
  onPatch,
  onAddSet,
  onCurrentDuration,
}: {
  pe: PlannedExercise
  highlightSetId?: string
  onPatch: (setId: string, patch: Partial<PlannedSet>) => void
  onAddSet?: () => void
  onCurrentDuration?: (sec: number) => void
}) {
  if (pe.kind === 'cardio') {
    const set = pe.sets[0]
    if (!set) return null
    const mins = Math.round((set.targetDurationSec ?? 300) / 60)
    return (
      <div className="set-log">
        <div className={rowClass(set, highlightSetId ?? set.id)}>
          <SetMark n={1} state={markState(set, highlightSetId ?? set.id)} />
          <OutlinedField
            label="分鐘"
            value={mins || undefined}
            disabled={set.completed}
            min={1}
            onChange={(m) => {
              const sec = m ? Math.round(m * 60) : undefined
              onPatch(set.id, { targetDurationSec: sec })
              if (sec) onCurrentDuration?.(sec)
            }}
          />
        </div>
      </div>
    )
  }

  const timed = pe.kind === 'timed'

  return (
    <div className="set-log">
      {pe.sets.map((set, i) => (
        <div key={set.id} className={rowClass(set, highlightSetId)}>
          <SetMark n={i + 1} state={markState(set, highlightSetId)} />
          {timed ? (
            <>
              <OutlinedField
                label="kg"
                value={set.targetWeight}
                disabled={set.completed}
                min={0}
                step={0.5}
                decimal
                onChange={(n) => onPatch(set.id, { targetWeight: n })}
              />
              <OutlinedField
                label="秒"
                value={set.targetDurationSec}
                disabled={set.completed}
                min={1}
                onChange={(sec) => {
                  onPatch(set.id, { targetDurationSec: sec })
                  if (sec && set.id === highlightSetId) onCurrentDuration?.(sec)
                }}
              />
            </>
          ) : (
            <>
              <OutlinedField
                label="次數"
                value={set.targetReps}
                disabled={set.completed}
                min={1}
                onChange={(n) => onPatch(set.id, { targetReps: n })}
              />
              <OutlinedField
                label="重量 (kg)"
                value={set.targetWeight}
                disabled={set.completed}
                min={0}
                step={0.5}
                decimal
                onChange={(n) => onPatch(set.id, { targetWeight: n })}
              />
            </>
          )}
        </div>
      ))}
      {onAddSet && (
        <button type="button" className="add-set" onClick={onAddSet}>
          <span className="set-hex add">
            <Plus size={13} />
          </span>
          加一組
        </button>
      )}
    </div>
  )
}

function SetMark({ n, state }: { n: number; state: 'current' | 'done' | '' }) {
  return (
    <span className={`set-hex ${state}`}>
      {n}
    </span>
  )
}

function OutlinedField({
  label,
  value,
  disabled,
  min,
  step,
  decimal,
  onChange,
}: {
  label: string
  value: number | undefined
  disabled?: boolean
  min?: number
  step?: number
  decimal?: boolean
  onChange: (value: number | undefined) => void
}) {
  return (
    <label className="set-field">
      <span>{label}</span>
      <input
        className="set-input"
        type="number"
        inputMode={decimal ? 'decimal' : 'numeric'}
        min={min}
        step={step}
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </label>
  )
}

function markState(set: PlannedSet, highlightSetId?: string): 'current' | 'done' | '' {
  if (set.completed) return 'done'
  if (set.id === highlightSetId) return 'current'
  return ''
}

function rowClass(set: PlannedSet, highlightSetId?: string) {
  const state = markState(set, highlightSetId)
  return `set-row${state ? ` ${state}` : ''}`
}
