import { Loader2, Sparkles } from 'lucide-react'
import type { MuscleGroup } from '@/lib/types'
import { DURATION_OPTIONS, MUSCLE_LABELS, PICKABLE_MUSCLES } from '@/data/exercises'

export function SuggestForm({
  focus,
  minutes,
  loading,
  onToggleMuscle,
  onMinutes,
  onSuggest,
  onAuto,
}: {
  focus: MuscleGroup[]
  minutes: number
  loading: boolean
  onToggleMuscle: (muscle: MuscleGroup) => void
  onMinutes: (value: number) => void
  onSuggest: () => void
  onAuto: () => void
}) {
  return (
    <div className="stack">
      <section className="up-next-head">
        <h1 className="display">今日練咩</h1>
        <p className="muted" style={{ margin: '6px 0 0' }}>
          揀部位同時間，跟住就有一套可以跟示範做嘅課表。
        </p>
      </section>

      <section className="panel">
        <h3 className="section-title">目標肌群</h3>
        <div className="pick-grid">
          {PICKABLE_MUSCLES.map((muscle) => (
            <button
              key={muscle}
              type="button"
              className={`pick-chip${focus.includes(muscle) ? ' active' : ''}`}
              onClick={() => onToggleMuscle(muscle)}
            >
              {MUSCLE_LABELS[muscle]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="section-title">時長</h3>
        <div className="pick-grid duration-grid">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.minutes}
              type="button"
              className={`pick-chip${minutes === opt.minutes ? ' active' : ''}`}
              onClick={() => onMinutes(opt.minutes)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <div className="sticky-cta">
        <button
          type="button"
          className="btn btn-primary btn-block display-btn"
          disabled={loading || focus.length === 0}
          onClick={onSuggest}
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
          {loading ? '排緊課表' : '產生課表'}
        </button>
        <button type="button" className="btn btn-ghost btn-block" disabled={loading} onClick={onAuto}>
          唔知練咩，你幫我揀
        </button>
      </div>
    </div>
  )
}
