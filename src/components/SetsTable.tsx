import type { PlannedExercise, PlannedSet } from '@/lib/types'

export function SetsTable({
  pe,
  highlightSetId,
  onPatch,
  onCurrentDuration,
}: {
  pe: PlannedExercise
  highlightSetId?: string
  onPatch: (setId: string, patch: Partial<PlannedSet>) => void
  onCurrentDuration?: (sec: number) => void
}) {
  if (pe.kind === 'cardio') {
    const set = pe.sets[0]
    if (!set) return null
    const mins = Math.round((set.targetDurationSec ?? 300) / 60)
    return (
      <table className="set-table cols-1">
        <thead>
          <tr>
            <th>分鐘</th>
          </tr>
        </thead>
        <tbody>
          <tr className={rowClass(set, highlightSetId)}>
            <td>
              <NumInput
                value={mins || undefined}
                disabled={set.completed}
                min={1}
                onChange={(m) => {
                  const sec = m ? Math.round(m * 60) : undefined
                  onPatch(set.id, { targetDurationSec: sec })
                  if (sec && set.id === highlightSetId) onCurrentDuration?.(sec)
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  if (pe.kind === 'timed') {
    return (
      <table className="set-table cols-3">
        <thead>
          <tr>
            <th>組</th>
            <th>kg</th>
            <th>秒</th>
          </tr>
        </thead>
        <tbody>
          {pe.sets.map((set, i) => (
            <tr key={set.id} className={rowClass(set, highlightSetId)}>
              <td className="set-index">{i + 1}</td>
              <td>
                <NumInput
                  value={set.targetWeight}
                  disabled={set.completed}
                  min={0}
                  step={0.5}
                  decimal
                  onChange={(n) => onPatch(set.id, { targetWeight: n })}
                />
              </td>
              <td>
                <NumInput
                  value={set.targetDurationSec}
                  disabled={set.completed}
                  min={1}
                  onChange={(sec) => {
                    onPatch(set.id, { targetDurationSec: sec })
                    if (sec && set.id === highlightSetId) onCurrentDuration?.(sec)
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <table className="set-table cols-3">
      <thead>
        <tr>
          <th>組</th>
          <th>kg</th>
          <th>reps</th>
        </tr>
      </thead>
      <tbody>
        {pe.sets.map((set, i) => (
          <tr key={set.id} className={rowClass(set, highlightSetId)}>
            <td className="set-index">{i + 1}</td>
            <td>
              <NumInput
                value={set.targetWeight}
                disabled={set.completed}
                min={0}
                step={0.5}
                decimal
                onChange={(n) => onPatch(set.id, { targetWeight: n })}
              />
            </td>
            <td>
              <NumInput
                value={set.targetReps}
                disabled={set.completed}
                min={1}
                onChange={(n) => onPatch(set.id, { targetReps: n })}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function NumInput({
  value,
  disabled,
  min,
  step,
  decimal,
  onChange,
}: {
  value: number | undefined
  disabled?: boolean
  min?: number
  step?: number
  decimal?: boolean
  onChange: (value: number | undefined) => void
}) {
  return (
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
  )
}

function rowClass(set: PlannedSet, highlightSetId?: string) {
  if (set.completed) return 'done'
  if (set.id === highlightSetId) return 'current'
  return ''
}
