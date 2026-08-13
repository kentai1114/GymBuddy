import { DIFFICULTY_LABELS, EQUIPMENT_LABELS, easierIds, getSwapOptions } from '@/data/exercises'

export function SwapSheet({
  currentId,
  onPick,
  onClose,
}: {
  currentId: string
  onPick: (exerciseId: string) => void
  onClose: () => void
}) {
  const options = getSwapOptions(currentId)
  const preferred = new Set(easierIds(currentId))
  return (
    <section className="panel swap-sheet">
      <div className="row space-between" style={{ marginBottom: 10 }}>
        <h3>換動作</h3>
        <button type="button" className="chip" onClick={onClose}>
          取消
        </button>
      </div>
      <p className="muted" style={{ margin: '0 0 10px', fontSize: '0.85rem' }}>
        上面係較易／替代，下面係同部位其他選擇。
      </p>
      <div className="swap-list">
        {options.map((ex) => (
          <button
            key={ex.id}
            type="button"
            className="swap-item"
            onClick={() => onPick(ex.id)}
          >
            <strong>{ex.nameZh}</strong>
            <span className="muted">
              {preferred.has(ex.id) || ex.difficulty === 'beginner' ? '較易 · ' : ''}
              {DIFFICULTY_LABELS[ex.difficulty ?? 'intermediate']} · {EQUIPMENT_LABELS[ex.equipment]}
            </span>
          </button>
        ))}
        {!options.length && <p className="muted">暫時冇可換嘅動作。</p>}
      </div>
    </section>
  )
}
