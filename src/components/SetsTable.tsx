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
      <table className="set-table">
        <thead>
          <tr>
            <th>分鐘</th>
          </tr>
        </thead>
        <tbody>
          <tr className={rowClass(set, highlightSetId)}>
            <td>
              <input
                className="set-input"
                type="number"
                inputMode="numeric"
                min={1}
                disabled={set.completed}
                value={mins || ''}
                onChange={(e) => {
                  const m = e.target.value === '' ? undefined : Number(e.target.value)
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
    const loaded = pe.sets.some((s) => (s.actualWeight ?? s.targetWeight) != null)
    return (
      <table className="set-table">
        <thead>
          <tr>
            <th>SET</th>
            {loaded && <th>KG</th>}
            <th>秒</th>
          </tr>
        </thead>
        <tbody>
          {pe.sets.map((set, i) => (
            <tr key={set.id} className={rowClass(set, highlightSetId)}>
              <td>{i + 1}</td>
              {loaded && (
                <td>
                  <input
                    className="set-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    disabled={set.completed}
                    value={set.targetWeight ?? ''}
                    onChange={(e) =>
                      onPatch(set.id, {
                        targetWeight: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </td>
              )}
              <td>
                <input
                  className="set-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  disabled={set.completed}
                  value={set.targetDurationSec ?? ''}
                  onChange={(e) => {
                    const sec = e.target.value === '' ? undefined : Number(e.target.value)
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
    <table className="set-table">
      <thead>
        <tr>
          <th>SET</th>
          <th>KG</th>
          <th>REPS</th>
        </tr>
      </thead>
      <tbody>
        {pe.sets.map((set, i) => (
          <tr key={set.id} className={rowClass(set, highlightSetId)}>
            <td>{i + 1}</td>
            <td>
              <input
                className="set-input"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                disabled={set.completed}
                value={set.targetWeight ?? ''}
                onChange={(e) =>
                  onPatch(set.id, {
                    targetWeight: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </td>
            <td>
              <input
                className="set-input"
                type="number"
                inputMode="numeric"
                min={1}
                disabled={set.completed}
                value={set.targetReps ?? ''}
                onChange={(e) =>
                  onPatch(set.id, {
                    targetReps: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function rowClass(set: PlannedSet, highlightSetId?: string) {
  if (set.completed) return 'done'
  if (set.id === highlightSetId) return 'current'
  return ''
}
