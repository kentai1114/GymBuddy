import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Play } from 'lucide-react'
import { EXERCISES, EQUIPMENT_LABELS, MUSCLE_LABELS, getExercise } from '@/data/exercises'
import type { MuscleGroup } from '@/lib/types'

const MUSCLES: Array<MuscleGroup | 'all'> = [
  'all',
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'cardio',
  'full_body',
]

export function DatabasePage() {
  const { id } = useParams()
  const [muscle, setMuscle] = useState<(typeof MUSCLES)[number]>('all')
  const [q, setQ] = useState('')

  const detail = id ? getExercise(id) : undefined

  const list = useMemo(() => {
    return EXERCISES.filter((ex) => {
      if (muscle !== 'all' && ex.muscle !== muscle) return false
      if (!q.trim()) return true
      const hay = `${ex.name} ${ex.nameZh} ${ex.equipment}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [muscle, q])

  if (detail) {
    return (
      <div className="page stack">
        <Link to="/database" className="row muted" style={{ gap: 6, width: 'fit-content' }}>
          <ArrowLeft size={16} /> 返回動作庫
        </Link>
        <header>
          <p className="brand-mark">FORGE</p>
          <h1 style={{ marginTop: 8, fontSize: '2.6rem' }}>{detail.nameZh}</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {detail.name}
          </p>
        </header>

        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="chip">{MUSCLE_LABELS[detail.muscle]}</span>
          <span className="chip" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text)' }}>
            {EQUIPMENT_LABELS[detail.equipment]}
          </span>
          <span className="chip" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text)' }}>
            {detail.kind === 'cardio' ? 'Cardio' : 'Weight Training'}
          </span>
        </div>

        <section className="video-frame">
          <iframe
            src={`https://www.youtube.com/embed/${detail.youtubeId}`}
            title={`${detail.name} demo`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </section>

        <section className="panel">
          <h3 style={{ marginBottom: 10 }}>Instructions</h3>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
            {detail.instructions.map((step) => (
              <li key={step} style={{ marginBottom: 8 }}>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="stat-grid">
          <div className="stat">
            <span className="muted">預設組數</span>
            <strong>{detail.defaultSets ?? (detail.kind === 'cardio' ? 1 : '-')}</strong>
          </div>
          <div className="stat">
            <span className="muted">休息</span>
            <strong>{detail.defaultRestSec ?? '-'}s</strong>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page stack">
      <header>
        <p className="brand-mark">FORGE</p>
        <h1 style={{ marginTop: 8 }}>Exercise Database</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Muscle / Equipment / Instructions / YouTube demo
        </p>
      </header>

      <input
        className="input"
        placeholder="搜尋動作…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="filters">
        {MUSCLES.map((m) => (
          <button
            key={m}
            className={`filter-chip${muscle === m ? ' active' : ''}`}
            onClick={() => setMuscle(m)}
          >
            {m === 'all' ? '全部' : MUSCLE_LABELS[m]}
          </button>
        ))}
      </div>

      <section className="panel">
        {list.map((ex) => (
          <Link key={ex.id} to={`/database/${ex.id}`} className="list-item">
            <div className="badge">
              <Play size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <strong>{ex.nameZh}</strong>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                {MUSCLE_LABELS[ex.muscle]} · {EQUIPMENT_LABELS[ex.equipment]} ·{' '}
                {ex.kind === 'cardio' ? '有氧計時' : '重量訓練'}
              </p>
            </div>
          </Link>
        ))}
        {!list.length && <div className="empty">搵唔到相關動作</div>}
      </section>
    </div>
  )
}
